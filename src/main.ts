import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

// TODO: реализовать семейный доступ
// TODO: реализовать сброс аккаунта
// TODO: реализовать улучшений вывод статистики
// TODO: подключить гпт чат для советов по финансам
