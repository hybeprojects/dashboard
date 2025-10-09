import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import * as speakeasy from 'speakeasy';
import { supabaseAdmin } from '../../lib/supabase.client';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    // create user in Supabase Auth
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const exists = existing?.users?.find((u: any) => u.email === dto.email);
    if (exists) throw new UnauthorizedException('Email already registered');

    // create supabase user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      user_metadata: { firstName: dto.firstName, lastName: dto.lastName },
    });
    if (error) throw new UnauthorizedException('Could not create user');

    // store in local users table for MFA and additional metadata
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    // use Supabase user's id as the local id so RLS can use auth.uid() directly
    const localId = (data && (data as any).user && (data as any).user.id) || undefined;
    const user = this.users.create({
      id: localId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    } as any);
    await this.users.save(user);
    // log to audit via Supabase table
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'register', user_id: user.id, ip_address: null }]);
    return { id: user.id, email: user.email };
  }

  async login({ email, password, otp }: { email: string; password: string; otp?: string }) {
    // verify against local user table
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.mfaEnabled) {
      if (!otp) throw new UnauthorizedException('MFA required');
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret || '',
        encoding: 'base32',
        token: otp,
        window: 1,
      });
      if (!verified) throw new UnauthorizedException('Invalid OTP');
    }

    // issue backend JWT
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    // create refresh token and return cookie value
    const refresh = await this.createRefreshToken(user.id);

    // log event
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'login', user_id: user.id, ip_address: null }]);

    return { accessToken, refreshCookieValue: refresh.cookieValue };
  }

  async exchangeSupabaseToken(accessToken: string) {
    // verify supabase token
    const { data: user, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) throw new UnauthorizedException('Invalid supabase token');
    // ensure local user exists
    let local = await this.users.findOne({ where: { email: user.user?.email } });
    if (!local) {
      const localId = user.user?.id || undefined;
      local = this.users.create({
        id: localId,
        email: user.user?.email || '',
        passwordHash: '',
        firstName: user.user?.user_metadata?.firstName,
        lastName: user.user?.user_metadata?.lastName,
      } as any);
      await this.users.save(local);
    }
    const accessTokenJwt = await this.jwt.signAsync(
      { sub: local.id, email: local.email },
      { expiresIn: '15m' },
    );

    // create refresh token
    const refresh = await this.createRefreshToken(local.id);

    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'supabase_exchange', user_id: local.id, ip_address: null }]);
    return { accessToken: accessTokenJwt, refreshCookieValue: refresh.cookieValue };
  }

  async createRefreshToken(userId: string) {
    const { v4: uuidv4 } = await import('uuid');
    const token = uuidv4() + '.' + Math.random().toString(36).slice(2);
    const tokenId = uuidv4();
    const hash = await argon2.hash(token, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('refresh_tokens')
      .insert([{ id: tokenId, user_id: userId, token_hash: hash, expires_at: expiresAt }]);
    // cookieValue contains id and token so we can lookup by id and verify
    return { id: tokenId, cookieValue: `${tokenId}|${token}` };
  }

  async rotateRefreshToken(tokenId: string, tokenValue: string) {
    const { data } = await supabaseAdmin
      .from('refresh_tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    if (!data) throw new UnauthorizedException('Invalid refresh token');
    const ok = await argon2.verify(data.token_hash, tokenValue);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');
    // create new
    const newToken = await this.createRefreshToken(data.user_id);
    // delete old
    await supabaseAdmin.from('refresh_tokens').delete().eq('id', tokenId);
    return { newToken, userId: data.user_id };
  }

  async revokeRefreshToken(tokenId: string) {
    await supabaseAdmin.from('refresh_tokens').delete().eq('id', tokenId);
  }

  async setupMfa(userId: string) {
    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauth = secret.otpauth_url || '';
    // store secret in local user table (base32)
    await this.users.update({ id: userId } as any, { mfaSecret: secret.base32 });
    return { otpauth, secret: secret.base32 };
  }

  async verifyMfa(userId: string, token: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new UnauthorizedException('MFA not setup');
    const ok = speakeasy.totp.verify({
      secret: user.mfaSecret || '',
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!ok) throw new UnauthorizedException('Invalid OTP');
    await this.users.update({ id: userId } as any, { mfaEnabled: true });
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'mfa_verified', user_id: userId, ip_address: null }]);
    return { success: true };
  }
}
