export enum MediaType {
  MEDIA = 'media',
  MOVIE = 'movie',
  SERIES = 'series',
}

export type MediaPaths = {
  [key in MediaType]: string;
};
