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
import { join, extname } from 'path';
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

  private getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'application/octet-stream';
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
      const mimeType = this.getMimeType(filePath);

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
        'Content-Type': mimeType,
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
