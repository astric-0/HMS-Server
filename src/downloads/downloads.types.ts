import { MediaType } from 'src/common/common.types';

export interface Downloadable {
  url: string;
  type: MediaType;
  filename: string;
  filePath: string;
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

export interface MediaJob<T> {
  id?: string;
  name: string;
  data: T;
  progress: number;
  failedReason?: string;
  finishedOn?: number;
  processedOn?: number;
}

export interface DownloadJobs {
  active: MediaJob<Downloadable>[];
  completed: MediaJob<Downloadable>[];
  waiting: MediaJob<Downloadable>[];
  failed: MediaJob<Downloadable>[];
}
