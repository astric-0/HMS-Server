import { MediaPaths, MediaType } from './types';

export class MediaConfig {
  private readonly mediaPaths: MediaPaths;
  private static instance: MediaConfig;

  public constructor() {
    this.mediaPaths = {
      [MediaType.MEDIA]: process.env.MEDIA_DIR,
      [MediaType.MOVIE]: process.env.MOVIE_DIR,
      [MediaType.SERIES]: process.env.SERIES_DIR,
    };
  }

  public static getInstance() {
    if (!MediaConfig.instance) MediaConfig.instance = new MediaConfig();
    return MediaConfig.instance;
  }

  public getMediaPath(type: MediaType) {
    return this.mediaPaths[type];
  }
}
