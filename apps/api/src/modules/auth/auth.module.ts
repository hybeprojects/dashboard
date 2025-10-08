import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../security/jwt.strategy';
import { OauthStrategy } from '../../security/oauth.strategy';
import { OidcStrategyFactory } from '../../security/oidc.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  providers: [AuthService, JwtStrategy, OauthStrategy, OidcStrategyFactory],
  controllers: [AuthController],
})
export class AuthModule {}
