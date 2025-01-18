import { Injectable, Inject } from '@nestjs/common';
import { extname, join } from 'path';
import { MediaConfig } from './media.config';
import { MediaType, SeriesDirectory, MovieDirectory } from './types';
import { existsSync, createReadStream, Dirent } from 'fs';
import { readdir, writeFile, readFile } from 'fs/promises';

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
      seriesName ?? '',
      seasonName ?? '',
      filename,
    );

    if (!existsSync(filePath)) return null;

    return filePath;
  }

  createReadStream(filePath: string, start: number, end: number) {
    return createReadStream(filePath, { start, end });
  }

  async readMovieDirectory(): Promise<MovieDirectory[]> {
    const path = this.mediaConfig.getMediaPath(MediaType.MOVIE);
    const files = await readdir(path);

    return files.map((filename) => ({
      name: filename,
      type: MediaType.MOVIE,
      url: `/media/file/${encodeURIComponent(filename)}?media_type=${MediaType.MOVIE}`,
    }));
  }

  async readSeriesDirectory(): Promise<SeriesDirectory[]> {
    const path = this.mediaConfig.getMediaPath(MediaType.SERIES);
    const series = await readdir(path, { withFileTypes: true });
    const media_type = MediaType.SERIES;

    const seriesPromises = series.map(async (sc) => {
      if (!sc.isDirectory()) return null;

      const seasons = await readdir(join(path, sc.name), {
        withFileTypes: true,
      });
      const series_name = sc.name;

      const seasonPromises = seasons.map(async (season: Dirent) => {
        if (!season.isDirectory()) return null;

        const episodes = await readdir(join(path, sc.name, season.name));
        const season_name = season.name;

        const query = new URLSearchParams({
          media_type,
          series_name,
          season_name,
        }).toString();

        return {
          name: season.name,
          episodes: episodes.map((episode) => ({
            name: episode,
            url: `/media/file/${encodeURIComponent(episode)}?${query}`,
            type: MediaType.SERIES,
          })),
        };
      });

      const resolvedSeasons = (await Promise.all(seasonPromises)).filter(
        Boolean,
      );

      return {
        name: sc.name,
        seasons: resolvedSeasons,
      };
    });

    return (await Promise.all(seriesPromises)).filter(Boolean);
  }

  async getSeriesJson(): Promise<SeriesDirectory[]> {
    try {
      const path = this.mediaConfig.getMediaPath(MediaType.SERIES_JSON);
      const json = await readFile(path, 'utf-8');
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to read series.json: ${error}`);
    }
  }

  async createSeriesJson() {
    try {
      const json: SeriesDirectory[] = await this.readSeriesDirectory();
      await writeFile(
        this.mediaConfig.getMediaPath(MediaType.SERIES_JSON),
        JSON.stringify(json, null, 2),
      );
    } catch (error) {
      throw new Error(`Failed to create series.json: ${error}`);
    }
  }
}
