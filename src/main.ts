import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Use createApplicationContext because no one connects to the bot
  // Bot itself connects to VK
  await NestFactory.createApplicationContext(AppModule);
}

bootstrap();
