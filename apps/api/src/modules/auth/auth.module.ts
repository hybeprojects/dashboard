import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../security/jwt.strategy';
import { OauthStrategy } from '../../security/oauth.strategy';
import { OidcStrategyFactory } from '../../security/oidc.strategy';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    RedisModule,
  ],
  providers: [AuthService, JwtStrategy, OauthStrategy, OidcStrategyFactory],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
