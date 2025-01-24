export enum MediaType {
  MEDIA = 'media',
  MOVIE = 'movie',
  SERIES = 'series',
  DOWNLOADS = 'default_download',
  MOVIE_SERIES = 'movie_series',
  SERIES_JSON = 'series.json',
  MOVIE_SERIES_JSON = 'movie_series.json',
  MOVIE_JSON = 'movie.json',
}

export type MediaPaths = {
  [key in MediaType]: string;
};

export interface MovieMetadata {
  title: string;
  duration: number;
  subtitles: SubtitleTrack[];
  audioTracks: AudioTrack[];
  videoInfo: {
    codec: string;
    resolution: string;
    bitrate: string;
  };
}

export interface SubtitleTrack {
  language: string;
  path: string;
  format: 'srt' | 'vtt' | 'ass';
}

export interface AudioTrack {
  language: string;
  codec: string;
  channels: string;
}

export interface Series {
  name: string;
  seasons: MovieSeries[];
}

export interface MovieSeries {
  name: string;
  episodes: Movies[];
}

export interface Movies {
  name: string;
  type: MediaType;
  url: string;
}

export interface Downloadable {
  url: string;
  type: MediaType;
  filename: string;
  filePath: string;
}
