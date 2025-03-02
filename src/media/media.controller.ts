import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Param,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Query,
  Inject,
  Body,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, statSync } from 'fs';
import { Response, Request } from 'express';

import { MediaService } from './media.service';
import { Directories, Jsons, MediaType } from 'src/common/common.types';
import { checkIfBackwardsPath } from 'src/common/common.helpers/check-if-backwards-path';

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
    const movies = await this.mediaService.getJson(Jsons.MOVIE_JSON);
    return { movies };
  }

  @Get('series/list')
  async getSeriesList() {
    const series = await this.mediaService.getJson(Jsons.SERIES_JSON);
    return { series };
  }

  @Get('movie-series/list')
  async getMovieSeriesList() {
    const movieSeries = await this.mediaService.getJson(
      Jsons.MOVIE_SERIES_JSON,
    );

    return { movieSeries };
  }

  @Post('json')
  async createJson(@Body('media_type') mediaType: Directories) {
    try {
      await this.mediaService.createJson(mediaType);

      return { message: 'File created' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('file/:filename/download')
  async downloadFile(
    @Param('filename') filename: string,
    @Query('media_type') mediaType: MediaType,
    @Res({ passthrough: true }) res: Response,
    @Query('series_name') seriesName?: string,
    @Query('season_name') seasonName?: string,
  ) {
    if (checkIfBackwardsPath(mediaType, seriesName, seasonName, filename))
      return new BadRequestException("Path can't be backwards");

    const filePath = this.mediaService.getMediaFilePath(
      filename,
      mediaType,
      seriesName,
      seasonName,
    );

    if (!filePath) {
      throw new BadRequestException(
        'Source path and root dir are strictly required',
      );
    }

    const fileStream = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(fileStream);
  }
}
