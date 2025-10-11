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
  // basic secure headers
  app.use(helmet());
  // Content Security Policy
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https:', 'wss:'],
    frameAncestors: ["'none'"],
  };
  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: cspDirectives as any,
    }),
  );

  if (!process.env.JWT_SECRET) {
    console.error(
      'JWT_SECRET is required for the API. Set a server-only JWT_SECRET and do NOT expose it to client envs.',
    );
    throw new Error('JWT_SECRET is required');
  }

  app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
  app.use(cookieParser());

  // additional security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
  });

  // CSRF protection for state-changing requests using cookies
  try {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: (process.env.SESSION_SAME_SITE as any) || 'lax',
        },
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
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}
bootstrap();
