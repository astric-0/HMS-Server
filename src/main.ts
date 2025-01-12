import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const MEDIA_DIR = join(__dirname, 'media');

  app.useStaticAssets(MEDIA_DIR, { prefix: '/thumbnails' });
  app.enableCors();

  const port = process.env.PORT;
  const host = process.env.HOST;
  console.log(`Server running at http://${host}:${port}`);

  await app.listen(port, host);
}

bootstrap();
