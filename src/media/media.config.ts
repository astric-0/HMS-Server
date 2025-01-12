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
    };
  }

  public getMediaPath(type: MediaType) {
    return this.mediaPaths[type];
  }
}
