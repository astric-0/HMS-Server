import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MediaModule } from './media/media.module';
import { DownloadsModule } from './downloads/downloads.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: { host: 'redis', port: 6379 },
    }),
    MediaModule,
    DownloadsModule,
    FilesModule,
  ],
})
export class AppModule {}
