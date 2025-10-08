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
  constructor(@InjectRepository(User) private users: Repository<User>, private jwt: JwtService) {}

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
    const user = this.users.create({ email: dto.email, passwordHash, firstName: dto.firstName, lastName: dto.lastName });
    await this.users.save(user);
    // log to audit via Supabase table
    await supabaseAdmin.from('audit_logs').insert([{ action: 'register', user_id: user.id, ip_address: null }]);
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
      const verified = speakeasy.totp.verify({ secret: user.mfaSecret || '', encoding: 'base32', token: otp, window: 1 });
      if (!verified) throw new UnauthorizedException('Invalid OTP');
    }

    // issue backend JWT
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });

    // log event
    await supabaseAdmin.from('audit_logs').insert([{ action: 'login', user_id: user.id, ip_address: null }]);

    return { accessToken };
  }
}
