import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaType, MediaPaths } from './types';

@Injectable()
export class MediaConfig {
  private readonly mediaPaths: MediaPaths;

  public constructor(private readonly configService: ConfigService) {
    this.mediaPaths = {
      [MediaType.MEDIA]: configService.get('MEDIA_DIR'),
      [MediaType.MOVIE]: configService.get('MOVIE_DIR'),
      [MediaType.SERIES]: configService.get('SERIES_DIR'),
      [MediaType.MOVIE_SERIES]: configService.get('MOVIE_SERIES_DIR'),
      [MediaType.SERIES_JSON]: configService.get('SERIES_JSON_PATH'),
      [MediaType.MOVIE_SERIES_JSON]: configService.get(
        'MOVIE_SERIES_JSON_PATH',
      ),
    };
  }

  public getMediaPath(type: MediaType) {
    return this.mediaPaths[type];
  }
}
