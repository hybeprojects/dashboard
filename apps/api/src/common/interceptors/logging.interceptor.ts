import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const now = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - now;
        const { statusCode } = context.switchToHttp().getResponse();
        const log = {
          method,
          url,
          statusCode,
          responseTime,
          ip,
          userAgent,
        };
        this.logger.log(JSON.stringify(log));
      }),
    );
  }
}
