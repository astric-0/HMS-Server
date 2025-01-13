export enum MediaType {
  MEDIA = 'media',
  MOVIE = 'movie',
  SERIES = 'series',
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
