export enum MediaType {
  MEDIA = 'media',
  MOVIE = 'movie',
  SERIES = 'series',
  MOVIE_SERIES = 'movie_series',
  SERIES_JSON = 'series.json',
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

export interface SeriesDirectory {
  name: string;
  seasons: {
    name: string;
    episodes: {
      name: string;
      url: string;
    }[];
  }[];
}

export interface MovieDirectory {
  name: string;
  type: MediaType.MOVIE;
  url: string;
}
