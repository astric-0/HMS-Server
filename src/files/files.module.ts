import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from 'src/media/media.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/common.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.FILE_EXTRACT_QUEUE,
    }),
    MediaModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
