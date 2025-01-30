import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { Downloadable } from './downloads.types';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(@Inject() private readonly downloadsService: DownloadsService) {}

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
