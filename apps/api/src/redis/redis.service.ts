import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;
  constructor() {
    // Use lazyConnect to avoid immediate unhandled connection errors in dev when Redis is not available.
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }
  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      /* ignore */
    }
  }
}
