import { Directories } from 'src/common/common.types';

export enum ActionType {
  MOVE = 'move',
}

export type ManagedDirectories =
  | Directories.MOVIE
  | Directories.MOVIE_SERIES
  | Directories.SERIES;

export interface Action {
  actionType: ActionType;
  file: File;
  destinationInfo: {
    moveTo: ManagedDirectories;
    path: string[];
  };
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  usedByDownloads: number;
  disk: string;
}

export interface File {
  name: string;
  size: number;
  isDir: boolean;
  extension: string;
  path: string;
}
