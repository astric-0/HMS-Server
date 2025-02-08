import { Inject, Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { getDiskInfo } from 'node-disk-info';
import {
  Directories,
  // Jsons
} from 'src/common/common.types';
import {
  //FileAction,
  StorageInfo,
  File,
  // FileActionInfo,
  RouteInfo,
} from './files.types';
import { MediaConfig } from 'src/media/media.config';
//import { moveFile } from './files.helpers/move-file';
//import { getDestionationPath } from './files.helpers/get-destionation-path';
import { resolve } from 'path';
import { getDirectorySize } from './files.helpers/get-directory-size';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/common/common.constants';
import { Queue } from 'bullmq';
import { readDirectory } from './files.helpers/read-directory';

@Injectable()
export class FilesService {
  constructor(
    @Inject(MediaConfig)
    private readonly mediaConfig: MediaConfig,
    @InjectQueue(QUEUE_NAMES.FILE_EXTRACT_QUEUE)
    private readonly extractionQueue: Queue,
  ) {}

  public async getJson(dirType: Directories): Promise<File[]> {
    return await this.mediaConfig.getJson<File[]>(dirType);
  }

  public async getDirectoryFiles(route: RouteInfo): Promise<File[]> {
    const path = this.mediaConfig.getPath(route.rootDir, ...route.path);
    return readDirectory(path);
  }

  public async deleteFile(file: File): Promise<boolean> {
    const path = this.mediaConfig.getPath(Directories.DOWNLOADS, file.name);
    await unlink(path);
    return true;
  }

  // public async performMoveAction({
  //   file,
  //   destinationInfo,
  // }: FileAction): Promise<boolean> {
  //   const source = this.mediaConfig.getPath(Directories.DOWNLOADS, file.name);

  //   const [isValid, path] = getDestionationPath(destinationInfo);
  //   if (!isValid) return false;

  //   const destination = this.mediaConfig.getPath(
  //     destinationInfo.sourceRoot,
  //     path,
  //     file.name,
  //   );

  //   await moveFile(source, destination);
  //   return true;
  // }

  public async getStorageInfo(): Promise<StorageInfo> {
    const disks = await getDiskInfo();

    const relativePath = this.mediaConfig.getPath(Directories.DOWNLOADS);
    const downloadsAbsolutePath = resolve(process.cwd(), relativePath);

    const currentDisk = disks.find((disk) =>
      downloadsAbsolutePath.startsWith(disk.mounted),
    );

    const size = await getDirectorySize(relativePath);

    return {
      disk: currentDisk.mounted,
      available: currentDisk.available,
      used: currentDisk.blocks - currentDisk.available,
      total: currentDisk.blocks,
      usedByDownloads: size,
    };
  }

  // public async addToExtractionQueue(fileAction: FileActionInfo) {

  // }
}
