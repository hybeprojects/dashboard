import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import * as NestCommon from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../../security/jwt.guard';
import { JwtService } from '@nestjs/jwt';

@NestCommon.Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

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
    const { accessToken, refreshCookieValue } = await this.auth.login(dto as any);
    // set secure httpOnly cookie
    res.cookie('refresh_token', refreshCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken };
  }

  @NestCommon.Post('supabase')
  async supabaseExchange(
    @NestCommon.Body() body: { accessToken: string },
    @NestCommon.Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshCookieValue } = await this.auth.exchangeSupabaseToken(
      body.accessToken,
    );
    res.cookie('refresh_token', refreshCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
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
    res.cookie('refresh_token', newToken.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
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
}
