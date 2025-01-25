import { Injectable, Inject } from '@nestjs/common';
import { join } from 'path';
import { readdir, writeFile, readFile } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { MediaConfig } from './media.config';
import {
  MediaType,
  Series,
  MovieSeries,
  Movies,
  Downloadable,
  MediaJob,
  DownloadJobs,
} from './media.types';
import { QUEUE_NAMES, JOBS_NAMES } from './media.constants';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MediaConfig)
    private readonly mediaConfig: MediaConfig,
    @InjectQueue(QUEUE_NAMES.MEDIA_QUEUE)
    private readonly mediaQueue: Queue,
  ) {}

  public getMediaFilePath(
    filename: string,
    type: MediaType,
    seriesName?: string,
    seasonName?: string,
    ignoreNotFound: boolean = false,
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

    if (!existsSync(filePath) && !ignoreNotFound) return null;

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

  public async createMovieSeriesJson() {
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

  public async readJson(
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

  public async createJson(mediaType: MediaType) {
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

  public async addToMediaQueue(
    download: Omit<Downloadable, 'filePath'>,
  ): Promise<boolean> {
    try {
      new URL(download.url);
    } catch {
      return false;
    }

    const filePath = this.getMediaFilePath(
      download.filename,
      MediaType.DOWNLOADS,
      '',
      '',
      true,
    );

    const fileToDownload: Downloadable = { ...download, filePath };

    const job = await this.mediaQueue.add(
      JOBS_NAMES.DOWNLOAD_MEDIA,
      fileToDownload,
    );

    return !!job;
  }

  private convertJob(jobs: Job<Downloadable>[]): MediaJob<Downloadable>[] {
    return jobs.map((x): MediaJob<Downloadable> => {
      const {
        id,
        progress,
        name,
        data,
        failedReason,
        processedOn,
        finishedOn,
      } = x;

      return {
        id,
        progress: progress as number,
        name,
        data,
        failedReason,
        processedOn,
        finishedOn,
      };
    });
  }

  public async getDownloadJobs(): Promise<DownloadJobs> {
    const [waiting, active, completed, failed]: [
      MediaJob<DownloadJobs>[],
      MediaJob<DownloadJobs>[],
      MediaJob<DownloadJobs>[],
      MediaJob<DownloadJobs>[],
    ] = await Promise.all([
      this.mediaQueue.getWaiting(),
      this.mediaQueue.getActive(),
      this.mediaQueue.getCompleted(),
      this.mediaQueue.getFailed(),
    ]);

    return {
      active,
      waiting,
      completed,
      failed,
    };
  }
}
