import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Body, Controller, Post, Req, Res, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../../security/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(RateLimitGuard)
  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.register(dto);
    return out;
  }

  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshCookieValue } = await this.auth.login(dto as any);
    // set secure httpOnly cookie
    res.cookie('refresh_token', refreshCookieValue, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    return { accessToken };
  }

  @Post('supabase')
  async supabaseExchange(@Body() body: { accessToken: string }, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshCookieValue } = await this.auth.exchangeSupabaseToken(body.accessToken);
    res.cookie('refresh_token', refreshCookieValue, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    return { accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies['refresh_token'];
    if (!cookie) return { error: 'No refresh token' };
    const [id, token] = cookie.split('|');
    const { newToken, userId } = await this.auth.rotateRefreshToken(id, token);
    const accessToken = await this.auth.jwt.signAsync({ sub: userId }, { expiresIn: '15m' });
    res.cookie('refresh_token', newToken.cookieValue, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    return { accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies['refresh_token'];
    if (cookie) {
      const [id] = cookie.split('|');
      await this.auth.revokeRefreshToken(id);
    }
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  async mfaSetup(@Req() req: any) {
    return this.auth.setupMfa(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async mfaVerify(@Req() req: any, @Body() body: { token: string }) {
    return this.auth.verifyMfa(req.user.sub, body.token);
  }
}
