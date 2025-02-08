import { Directories } from 'src/common/common.types';

export enum ActionType {
  MOVE = 'move',
  EXTRACT = 'extract',
}

// export interface FileAction {
//   actionType: ActionType;
//   file: File;

//   destination:
//   destinationInfo: {
//     destinationRoot: Directories;
//     sourceRoot: Directories;
//     path: string[];
//   };
// }

export interface FileAction {
  actionType: ActionType;
  filename: string;
  source: RouteInfo;
  destination: RouteInfo;
}

export interface RouteInfo {
  rootDir: Directories;
  path: string[];
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
