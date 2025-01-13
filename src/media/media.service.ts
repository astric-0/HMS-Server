import { Injectable, Inject } from '@nestjs/common';
import { extname, join } from 'path';
import { MediaConfig } from './media.config';
import { MediaType } from './types';
import { existsSync, createReadStream } from 'fs';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MediaConfig)
    private readonly mediaConfig: MediaConfig,
  ) {}

  public getMimeType(filePath: string): string {
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

  public getMediaFilePath(filename: string, type: MediaType): string | null {
    const mediaPath = this.mediaConfig.getMediaPath(type);
    const filePath = join(__dirname, '..', '..', mediaPath, filename);

    if (!existsSync(filePath)) return null;

    return filePath;
  }

  createReadStream(filePath: string, start: number, end: number) {
    return createReadStream(filePath, { start, end });
  }
}
