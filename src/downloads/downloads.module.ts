import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MediaModule } from 'src/media/media.module';
import { DownloadsService } from './downloads.service';
import { QUEUE_NAMES } from 'src/common/common.constants';
import { DownloadsController } from './downloads.controller';
import { DownloadsProcessor } from './downloads.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.MEDIA_QUEUE,
    }),
    MediaModule,
  ],
  controllers: [DownloadsController],
  providers: [DownloadsService, DownloadsProcessor],
})
export class DownloadsModule {}
