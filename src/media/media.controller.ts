import {
  Controller,
  Get,
  Res,
  Req,
  Param,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { readdir } from 'fs/promises';

@Controller('media')
export class MediaController {
  constructor(private configService: ConfigService) {}

  private readonly VIDEO_DIR =
    this.configService.get<string>('VIDEO_DIR') ||
    join(__dirname, '..', '..', 'media', 'videos');

  private getMediaFilePath(filename: string): string {
    const filePath = join(__dirname, '..', '..', this.VIDEO_DIR, filename);
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
  ) {
    try {
      const filePath = this.getMediaFilePath(filename);
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

  @Get('list')
  async getVideoList() {
    const files = await readdir(this.VIDEO_DIR);

    return {
      videos: files.map((filename) => ({
        name: filename,
        path: `/media/file/${filename}`,
      })),
    };
  }
}
