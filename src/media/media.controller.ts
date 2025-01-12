import {
  Controller,
  Get,
  Res,
  Req,
  Param,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { readdir } from 'fs/promises';
import { MediaType } from './types';
import { MediaConfig } from './media.config';

@Controller('media')
export class MediaController {
  constructor(private configService: ConfigService) {
    this.mediaConfig = MediaConfig.getInstance();
  }

  private readonly mediaConfig: MediaConfig;

  private getMediaFilePath(filename: string, type: MediaType): string {
    const mediaPath = this.mediaConfig.getMediaPath(type);
    const filePath = join(__dirname, '..', '..', mediaPath, filename);

    if (!existsSync(filePath)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    return filePath;
  }

  @Get('file/:filename')
  streamMedia(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('media_type') mediaType: MediaType,
  ) {
    try {
      const filePath = this.getMediaFilePath(filename, mediaType);
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
      const fileStream = createReadStream(filePath, { start, end });

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
  async getVideoList() {
    const files = await readdir(this.mediaConfig.getMediaPath(MediaType.MOVIE));

    return {
      videos: files.map((filename) => ({
        name: filename,
        type: MediaType.MOVIE,
        url: `/media/file/${filename}?media_type=${MediaType.MOVIE}`,
      })),
    };
  }
}
