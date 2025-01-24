import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaConfig } from './media.config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './media.constants';
import { MediaProcessor } from './media.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.MEDIA_QUEUE,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaConfig, MediaProcessor],
  exports: [MediaService],
})
export class MediaModule {}
