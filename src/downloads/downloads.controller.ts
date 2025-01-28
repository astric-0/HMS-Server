import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { Downloadable, File, StorageInfo } from './downloads.types';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(@Inject() private readonly downloadsService: DownloadsService) {}

  @Get()
  async getDownloadDirContents() {
    const [storageInfo, files]: [StorageInfo, File[]] = await Promise.all([
      this.downloadsService.getStorageInfo(),
      this.downloadsService.getJson(),
    ]);

    return { files, storageInfo };
  }

  @Delete()
  async deleteFile(@Body() file: File) {
    if (!file.name) throw new BadRequestException('Invalid file name');
    try {
      this.downloadsService.deleteFile(file);
      return { message: 'File removed successfully' };
    } catch (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  @Post('jobs')
  async downloadMedia(@Body() download: Omit<Downloadable, 'filePath'>) {
    try {
      const result = await this.downloadsService.addToMediaQueue(download);

      if (!result) {
        throw new BadRequestException('Invalid Values');
      }

      return { message: 'File added to queue for download' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Some error occured ${error.message}`,
      );
    }
  }

  @Get('jobs')
  async getDownloads() {
    const jobs = await this.downloadsService.getDownloadJobs();
    return { jobs };
  }
}
