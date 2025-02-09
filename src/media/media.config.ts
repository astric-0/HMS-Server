import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join } from 'path/posix';
import {
  MediaType,
  MediaPaths,
  Directories,
  Jsons,
} from 'src/common/common.types';

@Injectable()
export class MediaConfig {
  private readonly mediaPaths: MediaPaths;

  public constructor(private readonly configService: ConfigService) {
    this.mediaPaths = {
      [Directories.MEDIA]: this.configService.get('MEDIA_DIR'),
      [Directories.MOVIE]: this.configService.get('MOVIE_DIR'),
      [Directories.SERIES]: this.configService.get('SERIES_DIR'),
      [Directories.MOVIE_SERIES]: this.configService.get('MOVIE_SERIES_DIR'),
      [Directories.DOWNLOADS]: this.configService.get('DEFAULT_DOWNLOAD_DIR'),
      [Jsons.MOVIE_JSON]: this.configService.get('MOVIE_JSON_PATH'),
      [Jsons.MOVIE_SERIES_JSON]: this.configService.get(
        'MOVIE_SERIES_JSON_PATH',
      ),
      [Jsons.SERIES_JSON]: this.configService.get('SERIES_JSON_PATH'),
      [Jsons.DOWNLOADS_JSON]: this.configService.get(
        'DEFAULT_DOWNLOAD_JSON_PATH',
      ),
    };
  }

  public getMediaPath(type: MediaType) {
    return this.mediaPaths[type];
  }

  public mapDirectoriesToJsons(dirType: Directories): Jsons {
    switch (dirType) {
      case Directories.MOVIE:
        return this.getMediaPath(Jsons.MOVIE_JSON) as Jsons;
      case Directories.DOWNLOADS:
        return this.getMediaPath(Jsons.DOWNLOADS_JSON) as Jsons;
      case Directories.MOVIE_SERIES:
        return this.getMediaPath(Jsons.MOVIE_SERIES_JSON) as Jsons;
    }
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
