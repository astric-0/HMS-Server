import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const MEDIA_DIR = join(__dirname, 'media');

  app.useStaticAssets(MEDIA_DIR, { prefix: '/thumbnails' });
  app.enableCors();
  const port = 3000;
  console.log(`Server running at http://localhost:${port}`);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
