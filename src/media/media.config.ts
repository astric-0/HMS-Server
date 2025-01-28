import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join } from 'path/posix';
import { MediaType, MediaPaths } from 'src/common/types';

@Injectable()
export class MediaConfig {
  private readonly mediaPaths: MediaPaths;

  public constructor(private readonly configService: ConfigService) {
    this.mediaPaths = {
      [MediaType.MEDIA]: this.configService.get('MEDIA_DIR'),
      [MediaType.MOVIE]: this.configService.get('MOVIE_DIR'),
      [MediaType.SERIES]: this.configService.get('SERIES_DIR'),
      [MediaType.MOVIE_SERIES]: this.configService.get('MOVIE_SERIES_DIR'),
      [MediaType.MOVIE_JSON]: this.configService.get('MOVIE_JSON_PATH'),
      [MediaType.MOVIE_SERIES_JSON]: this.configService.get(
        'MOVIE_SERIES_JSON_PATH',
      ),
      [MediaType.SERIES_JSON]: this.configService.get('SERIES_JSON_PATH'),
      [MediaType.DOWNLOADS]: this.configService.get('DEFAULT_DOWNLOAD_DIR'),
      [MediaType.DOWNLOADS_JSON]: this.configService.get(
        'DEFAULT_DOWNLOAD_JSON_PATH',
      ),
    };
  }

  public getMediaPath(type: MediaType) {
    return this.mediaPaths[type];
  }

  public async getJson<T>(mediaType: MediaType): Promise<T> {
    try {
      const path = this.getMediaPath(mediaType);
      const json = await readFile(path, 'utf-8');
      return JSON.parse(json) as T;
    } catch (error) {
      throw new Error(`Failed to get json file: ${error}`);
    }
  }

  public getPath(type: MediaType, ...pathArgs: string[]): string {
    const mediaPath = this.getMediaPath(type);
    return join(__dirname, '..', '..', mediaPath, ...pathArgs);
  }
}
