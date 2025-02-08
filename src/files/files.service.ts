import { Inject, Injectable } from '@nestjs/common';
import { unlink, rm } from 'fs/promises';
import { getDiskInfo } from 'node-disk-info';
import { Queue } from 'bullmq';
import { resolve } from 'path';
import { InjectQueue } from '@nestjs/bullmq';

import { MediaConfig } from 'src/media/media.config';

import { QUEUE_NAMES } from 'src/common/common.constants';
import { Directories } from 'src/common/common.types';

import { StorageInfo, File, RouteInfo, FileAction } from './files.types';

import { moveFile } from './files.helpers/move-file';
import { getDirectorySize } from './files.helpers/get-directory-size';
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

  public async deleteFile(
    source: RouteInfo,
    filename: string,
    isDir: boolean,
  ): Promise<boolean> {
    const path = this.mediaConfig.getPath(
      source.rootDir,
      ...(source.path ?? []),
      filename ?? '',
    );

    if (!isDir) await rm(path, { recursive: true, force: true });
    else await unlink(path);

    return true;
  }

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

  public async performMoveAction({
    filename,
    source,
    destination,
  }: FileAction): Promise<boolean> {
    const sourcePath = this.mediaConfig.getPath(
      source.rootDir,
      ...source.path,
      filename,
    );

    const destinationPath = this.mediaConfig.getPath(
      destination.rootDir,
      ...destination.path,
      filename,
    );

    await moveFile(sourcePath, destinationPath);
    return true;
  }

  // public async addToExtractionQueue(fileAction: FileActionInfo) {

  // }
}
