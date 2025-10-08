import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    app.use((req, _res, next) => {
      Sentry.configureScope((scope) => {
        scope.setTag('service', 'api');
      });
      next();
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}
bootstrap();
