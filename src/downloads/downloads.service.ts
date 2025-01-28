import { InjectQueue } from '@nestjs/bullmq';
import { parse } from 'path/posix';
import { Inject, Injectable } from '@nestjs/common';
import { join } from 'path';
import { Job, Queue } from 'bullmq';
import { stat, unlink } from 'fs/promises';
import { getDiskInfo } from 'node-disk-info';
import { MediaConfig } from 'src/media/media.config';
import { JOBS_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { MediaType } from 'src/common/types';
import {
  Downloadable,
  DownloadJobs,
  MediaJob,
  StorageInfo,
  File,
} from './downloads.types';

@Injectable()
export class DownloadsService {
  constructor(
    @Inject(MediaConfig) private readonly mediaConfig: MediaConfig,
    @InjectQueue(QUEUE_NAMES.MEDIA_QUEUE) private readonly mediaQueue: Queue,
  ) {}

  public async addToMediaQueue(
    download: Omit<Downloadable, 'filePath'>,
  ): Promise<boolean> {
    try {
      new URL(download.url);
    } catch {
      return false;
    }

    const downloadDir = this.mediaConfig.getPath(MediaType.DOWNLOADS);
    const filePath = join(downloadDir, download.filename);
    const fileToDownload: Downloadable = { ...download, filePath };

    const job = await this.mediaQueue.add(
      JOBS_NAMES.DOWNLOAD_MEDIA,
      fileToDownload,
    );

    return !!job;
  }

  private convertJob(jobs: Job<Downloadable>[]): MediaJob<Downloadable>[] {
    return jobs.map((x): MediaJob<Downloadable> => {
      const {
        id,
        progress,
        name,
        data,
        failedReason,
        processedOn,
        finishedOn,
      } = x;

      return {
        id,
        progress: progress as number,
        name,
        data,
        failedReason,
        processedOn,
        finishedOn,
      };
    });
  }

  public async getJson(): Promise<File[]> {
    return await this.mediaConfig.getJson<File[]>(MediaType.DOWNLOADS_JSON);
  }

  public async getDownloadJobs(): Promise<DownloadJobs> {
    const [waiting, active, completed, failed]: [
      Job<Downloadable>[],
      Job<Downloadable>[],
      Job<Downloadable>[],
      Job<Downloadable>[],
    ] = await Promise.all([
      this.mediaQueue.getWaiting(),
      this.mediaQueue.getActive(),
      this.mediaQueue.getCompleted(),
      this.mediaQueue.getFailed(),
    ]);

    return {
      active: this.convertJob(active),
      waiting: this.convertJob(waiting),
      completed: this.convertJob(completed),
      failed: this.convertJob(failed),
    };
  }

  public async getStorageInfo(): Promise<StorageInfo> {
    const disks = await getDiskInfo();
    const currentRoot = parse(process.cwd()).root;
    const currentDisk = disks.find((disk) => disk.mounted == currentRoot);

    const info = await stat(this.mediaConfig.getPath(MediaType.DOWNLOADS));

    return {
      disk: currentDisk.mounted,
      available: currentDisk.available,
      used: currentDisk.blocks - currentDisk.available,
      total: currentDisk.blocks,
      usedByDownloads: info.size,
    };
  }

  public async deleteFile(file: File): Promise<boolean> {
    const path = this.mediaConfig.getPath(MediaType.DOWNLOADS, file.name);
    await unlink(path);
    return true;
  }
}
