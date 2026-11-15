/* cspell:disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('🚀 API Horto Florestal ligada ao PostgreSQL (Neon) em http://localhost:3000/api');
}
bootstrap();