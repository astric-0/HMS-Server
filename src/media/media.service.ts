import { Injectable, Inject } from '@nestjs/common';
import { join } from 'path';
import { readdir, writeFile, readFile } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';

import { MediaConfig } from './media.config';
import { MediaType, Series, MovieSeries, Movies } from './types';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MediaConfig)
    private readonly mediaConfig: MediaConfig,
  ) {}

  public getMediaFilePath(
    filename: string,
    type: MediaType,
    seriesName?: string,
    seasonName?: string,
  ): string | null {
    const mediaPath = this.mediaConfig.getMediaPath(type);
    const filePath = join(
      __dirname,
      '..',
      '..',
      mediaPath,
      decodeURIComponent(seriesName ?? ''),
      decodeURIComponent(seasonName ?? ''),
      decodeURIComponent(filename),
    );

    if (!existsSync(filePath)) return null;

    return filePath;
  }

  public createReadStream(filePath: string, start: number, end: number) {
    return createReadStream(filePath, { start, end });
  }

  public async readMovieDirectory(
    path: string = this.mediaConfig.getMediaPath(MediaType.MOVIE),
    media_type: MediaType = MediaType.MOVIE,
    query: URLSearchParams = new URLSearchParams({
      media_type,
    }),
  ): Promise<Movies[]> {
    const files = await readdir(path);

    return files.map((filename) => ({
      name: filename,
      type: media_type,
      url: `/media/file/${encodeURIComponent(filename)}?${query.toString()}`,
    }));
  }

  public async readMovieSeriesDirectory(
    path: string = this.mediaConfig.getMediaPath(MediaType.MOVIE_SERIES),
    media_type: MediaType = MediaType.MOVIE_SERIES,
    series_name: string = '',
  ): Promise<MovieSeries[]> {
    const seasons = await readdir(path, { withFileTypes: true });

    return (
      await Promise.all(
        seasons.map(async (season) => {
          if (!season.isDirectory()) return null;

          const query = new URLSearchParams({
            media_type,
            season_name: season.name,
            series_name,
          });

          return {
            name: season.name,
            episodes: await this.readMovieDirectory(
              join(path, season.name),
              media_type,
              query,
            ),
          };
        }),
      )
    ).filter(Boolean);
  }

  public async readSeriesDirectory(): Promise<Series[]> {
    const path = this.mediaConfig.getMediaPath(MediaType.SERIES);
    const shows = await readdir(path, { withFileTypes: true });

    const seriesPromises = shows.map(async (sc) => {
      if (!sc.isDirectory()) return null;

      const seasons = await this.readMovieSeriesDirectory(
        join(path, sc.name),
        MediaType.SERIES,
        sc.name,
      );

      return {
        name: sc.name,
        seasons,
      };
    });

    return (await Promise.all(seriesPromises)).filter(Boolean);
  }

  public async getJson(
    mediaType: MediaType,
  ): Promise<Movies[] | MovieSeries[] | Series[]> {
    try {
      const path = this.mediaConfig.getMediaPath(mediaType);
      const json = await readFile(path, 'utf-8');
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to get json file: ${error}`);
    }
  }

  async createMovieSeriesJson() {
    try {
      const json: MovieSeries[] = await this.readMovieSeriesDirectory();
      await writeFile(
        this.mediaConfig.getMediaPath(MediaType.MOVIE_SERIES_JSON),
        JSON.stringify(json, null, 2),
      );
    } catch (error) {
      throw new Error(`Failed to create movie series.json: ${error}`);
    }
  }

  async readJson(
    mediaType: MediaType,
  ): Promise<[MovieSeries[] | Movies[] | Series[], MediaType]> {
    try {
      switch (mediaType) {
        case MediaType.MOVIE_SERIES:
          return [
            await this.readMovieSeriesDirectory(),
            MediaType.MOVIE_SERIES_JSON,
          ];
        case MediaType.MOVIE:
          return [await this.readMovieDirectory(), MediaType.MOVIE_JSON];
        case MediaType.SERIES:
          return [await this.readSeriesDirectory(), MediaType.SERIES_JSON];
      }
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  async createJson(mediaType: MediaType) {
    try {
      const [json, jsonMediaType] = await this.readJson(mediaType);
      await writeFile(
        this.mediaConfig.getMediaPath(jsonMediaType),
        JSON.stringify(json, null, 2),
      );
    } catch (error) {
      throw new Error(`Failed to create file: ${error}`);
    }
  }
}
