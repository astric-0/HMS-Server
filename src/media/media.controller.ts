import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Param,
  InternalServerErrorException,
  Query,
  NotFoundException,
  Inject,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { statSync } from 'fs';
import { Response, Request } from 'express';

import { Downloadable, MediaType } from './media.types';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(
    @Inject(MediaService)
    private readonly mediaService: MediaService,
  ) {}

  @Get('file/:filename')
  streamMedia(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('media_type') mediaType: MediaType,
    @Query('series_name') seriesName?: string,
    @Query('season_name') seasonName?: string,
  ) {
    try {
      const filePath = this.mediaService.getMediaFilePath(
        filename,
        mediaType,
        seriesName,
        seasonName,
      );

      if (!filePath) {
        throw new NotFoundException('File not found');
      }

      const stat = statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (!range) {
        res.status(416).send('Range header is required');
        return;
      }

      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).send('Range not satisfiable');
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = this.mediaService.createReadStream(
        filePath,
        start,
        end,
      );

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      fileStream.pipe(res);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('movies/list')
  async getMovieList() {
    const movies = await this.mediaService.getJson(MediaType.MOVIE_JSON);
    return { movies };
  }

  @Get('series/list')
  async getSeriesList() {
    const series = await this.mediaService.getJson(MediaType.SERIES_JSON);
    return { series };
  }

  @Get('movie-series/list')
  async getMovieSeriesList() {
    const movieSeries = await this.mediaService.getJson(
      MediaType.MOVIE_SERIES_JSON,
    );

    return { movieSeries };
  }

  @Get('downloads/list')
  async getDownloadDirContents() {
    const files = await this.mediaService.getJson(MediaType.DOWNLOADS_JSON);
    return { files };
  }

  @Post('json')
  async createJson(@Body('media_type') mediaType: MediaType) {
    try {
      await this.mediaService.createJson(mediaType);

      return { message: 'File created' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('downloads-jobs')
  async getDownloads() {
    const jobs = await this.mediaService.getDownloadJobs();
    return { jobs };
  }

  @Post('download-jobs')
  async downloadMedia(@Body() download: Omit<Downloadable, 'filePath'>) {
    try {
      const result = await this.mediaService.addToMediaQueue(download);

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
}
