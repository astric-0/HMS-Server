import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from './media/media.module';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MediaModule,
    BullModule.forRoot({
      connection: { host: 'redis', port: 6379 },
    }),
  ],
})
export class AppModule {}
