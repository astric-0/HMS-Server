import { Injectable, Inject } from '@nestjs/common';
import { extname, join } from 'path';
import { MediaConfig } from './media.config';
import { MediaType } from './types';
import { existsSync, createReadStream } from 'fs';
import { spawn } from 'child_process';
import { Readable, PassThrough } from 'stream';

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

  public convertChunkToMp4(
    filePath: string,
    start: number,
    end: number,
  ): Readable {
    const ext = extname(filePath).toLowerCase();
    if (ext === '.mp4') {
      return createReadStream(filePath, { start, end });
    }

    const ffmpeg = spawn('ffmpeg', [
      '-ss',
      `${start / 1024}`,
      '-i',
      filePath,
      '-t',
      `${(end - start) / 1024}`,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-f',
      'mp4',
      '-movflags',
      'frag_keyframe+empty_moov+default_base_moof',
      'pipe:1',
    ]);

    const outputStream = new PassThrough();
    ffmpeg.stdout.pipe(outputStream);
    ffmpeg.stderr.on('data', (data) => console.log(data.toString()));

    return outputStream;
  }
}
