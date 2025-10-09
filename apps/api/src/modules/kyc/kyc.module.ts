import { Module } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycSubmission } from './kyc.entity';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([KycSubmission]), RedisModule],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
