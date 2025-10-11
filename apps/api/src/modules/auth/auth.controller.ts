import * as NestCommon from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../../security/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@NestCommon.Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private cookieOptions() {
    const sameSite = (process.env.SESSION_SAME_SITE as any) || 'lax';
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    } as any;
  }

  @NestCommon.UseGuards(RateLimitGuard)
  @NestCommon.Post('register')
  async register(
    @NestCommon.Body() dto: CreateUserDto,
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.auth.register(dto);
    return out;
  }

  @NestCommon.UseGuards(RateLimitGuard)
  @NestCommon.Post('login')
  async login(
    @NestCommon.Body() dto: LoginDto,
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshCookieValue, user } = await this.auth.login(dto as any);
    // set secure httpOnly cookie
    res.cookie('refresh_token', refreshCookieValue, this.cookieOptions());
    return { accessToken, user };
  }

  @NestCommon.Post('supabase')
  async supabaseExchange(
    @NestCommon.Body() body: { accessToken: string },
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshCookieValue } = await this.auth.exchangeSupabaseToken(
      body.accessToken,
    );
    res.cookie('refresh_token', refreshCookieValue, this.cookieOptions());
    return { accessToken };
  }

  @NestCommon.Post('refresh')
  async refresh(
    @NestCommon.Req() req: Request,
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const cookie = req.cookies['refresh_token'];
    if (!cookie) return { error: 'No refresh token' };
    const [id, token] = cookie.split('|');
    const { newToken, userId } = await this.auth.rotateRefreshToken(id, token);
    const accessToken = await this.jwt.signAsync({ sub: userId }, { expiresIn: '15m' });
    res.cookie('refresh_token', newToken.cookieValue, this.cookieOptions());
    return { accessToken };
  }

  @NestCommon.Post('logout')
  async logout(
    @NestCommon.Req() req: Request,
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const cookie = req.cookies['refresh_token'];
    if (cookie) {
      const [id] = cookie.split('|');
      await this.auth.revokeRefreshToken(id);
    }
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @NestCommon.UseGuards(JwtAuthGuard)
  @NestCommon.Post('mfa/setup')
  async mfaSetup(@NestCommon.Req() req: any) {
    return this.auth.setupMfa(req.user.sub);
  }

  @NestCommon.UseGuards(JwtAuthGuard)
  @NestCommon.Post('mfa/verify')
  async mfaVerify(@NestCommon.Req() req: any, @NestCommon.Body() body: { token: string }) {
    return this.auth.verifyMfa(req.user.sub, body.token);
  }

  // Resend magic link / OTP with server-side rate limiting and tracking
  @NestCommon.UseGuards(RateLimitGuard)
  @NestCommon.Post('resend')
  async resend(@NestCommon.Body() body: { email?: string; phone?: string }) {
    const keyBase = (body.email || body.phone || 'unknown').toString().toLowerCase();
    const perMinKey = `resend:count:${keyBase}`;
    const perDayKey = `resend:day:${keyBase}`;
    const lastKey = `resend:last:${keyBase}`;

    // increment per-minute counter and set ttl 60s
    const multi = this.redis.client.multi();
    multi.incr(perMinKey).expire(perMinKey, 60);
    multi.incr(perDayKey).expire(perDayKey, 24 * 60 * 60);
    const res = await multi.exec();
    const perMin = Number(res?.[0]?.[1] || 0);
    const perDay = Number(res?.[1]?.[1] || 0);

    if (perMin > 5) {
      return { ok: false, message: 'Too many requests, wait a minute' };
    }
    if (perDay > 50) {
      return { ok: false, message: 'Daily resend limit reached' };
    }

    // record last sent timestamp
    await this.redis.client.set(lastKey, new Date().toISOString());

    // log audit (best-effort)
    try {
      if ((this.auth as any).logAudit) {
        await (this.auth as any).logAudit('resend', keyBase);
      }
    } catch (e) {
      // ignore
    }

    return { ok: true, message: 'Allowed' };
  }

  @NestCommon.UseGuards(RateLimitGuard)
  @NestCommon.Get('link-status')
  async linkStatus(
    @NestCommon.Query('email') email?: string,
    @NestCommon.Query('phone') phone?: string,
  ) {
    const keyBase = (email || phone || 'unknown').toString().toLowerCase();
    const perDayKey = `resend:day:${keyBase}`;
    const lastKey = `resend:last:${keyBase}`;
    const [count, last] = await Promise.all([
      this.redis.client.get(perDayKey),
      this.redis.client.get(lastKey),
    ]);
    return { attemptsToday: Number(count || 0), lastSent: last || null };
  }

  // Minimal profile endpoint
  @NestCommon.UseGuards(JwtAuthGuard)
  @NestCommon.Get('me')
  async me(@NestCommon.Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { user: null };
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return { user: null };
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      },
    };
  }
}
