export enum Directories {
  MEDIA = 'media',
  MOVIE = 'movie',
  MOVIE_SERIES = 'movie_series',
  SERIES = 'series',
  DOWNLOADS = 'default_downloads',
}

export enum Jsons {
  SERIES_JSON = 'series.json',
  MOVIE_SERIES_JSON = 'movie_series.json',
  DOWNLOADS_JSON = 'downloads.json',
  MOVIE_JSON = 'movie.json',
}

export type MediaType = Jsons | Directories;

export type MediaPaths = {
  [key in MediaType]: string;
};
