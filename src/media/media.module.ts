import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaConfig } from './media.config';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, MediaConfig],
  exports: [MediaConfig],
})
export class MediaModule {}
