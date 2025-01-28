export enum MediaType {
  MEDIA = 'media',
  MOVIE = 'movie',
  SERIES = 'series',
  DOWNLOADS = 'default_downloads',
  MOVIE_SERIES = 'movie_series',
  SERIES_JSON = 'series.json',
  MOVIE_SERIES_JSON = 'movie_series.json',
  DOWNLOADS_JSON = 'downloads.json',
  MOVIE_JSON = 'movie.json',
}

export type MediaPaths = {
  [key in MediaType]: string;
};
