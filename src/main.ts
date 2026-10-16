import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';
import { DominioExceptionFilter } from './common/filters/dominio-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { obtenerOrigenesCors } from './config/cors.config.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  process.loadEnvFile?.('.env');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const allowedOrigins = obtenerOrigenesCors();
  app.enableCors({ origin: allowedOrigins });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new DominioExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API Sistema de Reservas')
    .setDescription('Documentación interactiva de la API del Sistema de Reservas y Agenda')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
