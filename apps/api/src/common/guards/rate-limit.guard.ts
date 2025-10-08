import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = `rl:${req.ip}`;
    const res = await this.redis.client.multi().incr(key).expire(key, 60).exec();
    const count = Number(res?.[0]?.[1] || 0);
    if (count > 120) throw new TooManyRequestsException('Rate limit exceeded');
    return true;
  }
}
