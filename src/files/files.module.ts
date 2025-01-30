import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from 'src/media/media.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [ConfigModule, MediaModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
