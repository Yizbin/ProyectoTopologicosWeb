import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';
import { DominioExceptionFilter } from './common/filters/dominio-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  process.loadEnvFile?.('.env');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.enableCors({ origin: 'http://localhost:5173' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new DominioExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
