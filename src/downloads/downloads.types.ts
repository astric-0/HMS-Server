import { MediaType } from 'src/common/types';

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

export interface File {
  name: string;
  size: number;
  isDir: boolean;
  extension: string;
  path: string;
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  usedByDownloads: number;
  disk: string;
}

export enum ActionType {
  MOVE = 'move',
}

export type ManagedDirectories =
  | MediaType.MOVIE
  | MediaType.MOVIE_SERIES
  | MediaType.SERIES;

export interface Action {
  actionType: ActionType;
  file: File;
  destinationInfo: {
    moveTo: ManagedDirectories;
    path: string[];
  };
}
