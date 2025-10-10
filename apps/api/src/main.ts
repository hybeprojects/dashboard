import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
  app.use(cookieParser());
  // CSRF protection for state-changing requests using cookies
  try {
    app.use(
      csurf({
        cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
      }),
    );
  } catch (e) {
    // csurf may throw if not applicable in some environments
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    (Sentry as any).init({ dsn, tracesSampleRate: 0.1 });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      try {
        const s = (Sentry as any);
        if (typeof s.configureScope === 'function') {
          s.configureScope((scope: any) => {
            scope.setTag('service', 'api');
            if ((req as any).user) scope.setUser({ id: (req as any).user.sub });
          });
        } else if (s && s.getCurrentHub && typeof s.getCurrentHub().configureScope === 'function') {
          s.getCurrentHub().configureScope((scope: any) => {
            scope.setTag('service', 'api');
            if ((req as any).user) scope.setUser({ id: (req as any).user.sub });
          });
        }
      } catch (e) {
        // best-effort; continue without Sentry scope
      }
      next();
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}
bootstrap();
