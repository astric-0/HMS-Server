import { Injectable, Inject } from '@nestjs/common';
import { extname, join } from 'path';
import { readdir, writeFile, stat } from 'fs/promises';
import { existsSync, createReadStream, Dirent } from 'fs';
import { MediaConfig } from './media.config';
import { Series, MovieSeries, Movies } from './media.types';
import { Directories, Jsons, MediaType } from 'src/common/common.types';
import { File } from 'src/files/files.types';

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
    ignoreNotFound: boolean = false,
  ): string | null {
    const filePath = this.mediaConfig.getPath(
      type,
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
    path: string = this.mediaConfig.getPath(Directories.MOVIE),
    media_type: MediaType = Directories.MOVIE,
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
    path: string = this.mediaConfig.getPath(Directories.MOVIE_SERIES),
    media_type: MediaType = Directories.MOVIE_SERIES,
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
    const path = this.mediaConfig.getPath(Directories.SERIES);
    const shows = await readdir(path, { withFileTypes: true });

    const seriesPromises = shows.map(async (sc) => {
      if (!sc.isDirectory()) return null;

      const seasons = await this.readMovieSeriesDirectory(
        join(path, sc.name),
        Directories.SERIES,
        sc.name,
      );

      return {
        name: sc.name,
        seasons,
      };
    });

    return (await Promise.all(seriesPromises)).filter(Boolean);
  }

  public async readDownloadsDirectory(): Promise<File[]> {
    const path = this.mediaConfig.getPath(Directories.DOWNLOADS);
    const files = await readdir(path, { withFileTypes: true });

    const data: File[] = await Promise.all(
      files.map(async (file: Dirent): Promise<File> => {
        const filePath = join(path, file.name);
        const fileStat = await stat(filePath);
        return {
          isDir: file.isDirectory(),
          name: file.name,
          size: fileStat.size,
          path: filePath,
          extension: extname(file.name),
        };
      }),
    );

    return data;
  }

  public async getJson(
    mediaType: MediaType,
  ): Promise<Movies[] | MovieSeries[] | Series[]> {
    try {
      const json = await this.mediaConfig.getJson<
        Movies[] | MovieSeries[] | Series[]
      >(mediaType);

      return json;
    } catch (error) {
      throw new Error(`Failed to get json file: ${error}`);
    }
  }

  public async createMovieSeriesJson() {
    try {
      const json: MovieSeries[] = await this.readMovieSeriesDirectory();
      await writeFile(
        this.mediaConfig.getMediaPath(Jsons.MOVIE_SERIES_JSON),
        JSON.stringify(json, null, 2),
      );
    } catch (error) {
      throw new Error(`Failed to create movie series.json: ${error}`);
    }
  }

  public async readJson(
    dirType: Directories,
  ): Promise<[MovieSeries[] | Movies[] | Series[] | File[], Jsons]> {
    try {
      switch (dirType) {
        case Directories.MOVIE_SERIES:
          return [
            await this.readMovieSeriesDirectory(),
            Jsons.MOVIE_SERIES_JSON,
          ];
        case Directories.MOVIE:
          return [await this.readMovieDirectory(), Jsons.MOVIE_JSON];
        case Directories.SERIES:
          return [await this.readSeriesDirectory(), Jsons.SERIES_JSON];
        case Directories.DOWNLOADS:
          return [await this.readDownloadsDirectory(), Jsons.DOWNLOADS_JSON];
      }
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  public async createJson(dir: Directories) {
    try {
      const [json, jsonMediaType] = await this.readJson(dir);
      await writeFile(
        this.mediaConfig.getMediaPath(jsonMediaType),
        JSON.stringify(json, null, 2),
      );
    } catch (error) {
      throw new Error(`Failed to create file: ${error}`);
    }
  }
}
