import { Inject, Injectable } from '@nestjs/common';
import { stat, unlink } from 'fs/promises';
import { getDiskInfo } from 'node-disk-info';
import { parse } from 'path/posix';
import { Directories, Jsons } from 'src/common/common.types';
import { Action, StorageInfo, File } from './files.types';
import { MediaConfig } from 'src/media/media.config';
import { moveFile } from './files.helpers/move-file';
import { getDestionationPath } from './files.helpers/get-destionation-path';

@Injectable()
export class FilesService {
  constructor(@Inject(MediaConfig) private readonly mediaConfig: MediaConfig) {}

  public async getJson(): Promise<File[]> {
    return await this.mediaConfig.getJson<File[]>(Jsons.DOWNLOADS_JSON);
  }

  public async deleteFile(file: File): Promise<boolean> {
    const path = this.mediaConfig.getPath(Directories.DOWNLOADS, file.name);
    await unlink(path);
    return true;
  }

  public async performMoveAction({
    file,
    destinationInfo,
  }: Action): Promise<boolean> {
    const source = this.mediaConfig.getPath(Directories.DOWNLOADS, file.name);

    const [isValid, path] = getDestionationPath(destinationInfo);
    if (!isValid) return false;

    const destination = this.mediaConfig.getPath(
      destinationInfo.moveTo,
      path,
      file.name,
    );

    await moveFile(source, destination);
    return true;
  }

  public async getStorageInfo(): Promise<StorageInfo> {
    const disks = await getDiskInfo();
    const currentRoot = parse(process.cwd()).root;
    const currentDisk = disks.find((disk) => disk.mounted == currentRoot);

    const info = await stat(this.mediaConfig.getPath(Directories.DOWNLOADS));

    return {
      disk: currentDisk.mounted,
      available: currentDisk.available,
      used: currentDisk.blocks - currentDisk.available,
      total: currentDisk.blocks,
      usedByDownloads: info.size,
    };
  }
}
