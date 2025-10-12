import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycDetail } from './kyc-detail.entity';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([KycDetail]), RedisModule],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
