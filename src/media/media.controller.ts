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
import { createReadStream, statSync } from 'fs';
import { Response, Request } from 'express';
import { readdir } from 'fs/promises';
import { MediaType } from './types';
import { MediaConfig } from './media.config';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(
    @Inject(MediaService)
    private readonly mediaService: MediaService,
    @Inject(MediaConfig)
    private readonly mediaConfig: MediaConfig,
  ) {}

  @Get('file/:filename')
  streamMedia(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('media_type') mediaType: MediaType,
  ) {
    try {
      const filePath = this.mediaService.getMediaFilePath(filename, mediaType);

      if (!filePath) {
        throw new NotFoundException('File not found');
      }

      const mimeType = this.mediaService.getMimeType(filePath);

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
