import { MediaType } from 'src/common/types';

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

export interface MediaJob<T> {
  id?: string;
  name: string;
  data: T;
  progress: number;
  failedReason?: string;
  finishedOn?: number;
  processedOn?: number;
}
