import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { configuredWebOrigin } from './auth/auth.security';

config({ path: resolve(process.cwd(), '../../.env') });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const webOrigin = configuredWebOrigin();
  app.enableCors({ origin: webOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = Number(process.env.API_PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('API_PORT must be an integer from 1 to 65535');
  }
  await app.listen(port);
}

void bootstrap();
