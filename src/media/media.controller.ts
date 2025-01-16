import {
  Controller,
  Get,
  Res,
  Req,
  Param,
  InternalServerErrorException,
  Query,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { statSync } from 'fs';
import { Response, Request } from 'express';
import { MediaType } from './types';
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
    const movies = await this.mediaService.readMovieDirectory();
    return { movies };
  }

  @Get('series/list')
  async getSeriesList() {
    const series = await this.mediaService.getSeriesJson();
    return { series };
  }

  @Get('create-series-json')
  async createSeriesJson() {
    try {
      await this.mediaService.createSeriesJson();
      return { message: 'Series directory created' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
