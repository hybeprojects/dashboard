import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../security/jwt.strategy';
import { OauthStrategy } from '../../security/oauth.strategy';
import { OidcStrategyFactory } from '../../security/oidc.strategy';
import { RedisModule } from '../../redis/redis.module';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), RedisModule],
  providers: [AuthService, JwtStrategy, OauthStrategy, OidcStrategyFactory, RateLimitGuard],
  controllers: [AuthController],
})
export class AuthModule {}
