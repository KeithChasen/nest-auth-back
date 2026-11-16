import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // cut fields not in DTO
      forbidNonWhitelisted: true, // throws error if there's extra fields
      transform: true, // auto type casting
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3000', // frontend
    credentials: true, // allow sending cookies
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
