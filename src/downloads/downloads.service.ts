import { InjectQueue } from '@nestjs/bullmq';

import { Inject, Injectable } from '@nestjs/common';
import { join } from 'path';
import { Job, Queue } from 'bullmq';

import { MediaConfig } from 'src/media/media.config';
import { JOBS_NAMES, QUEUE_NAMES } from 'src/common/common.constants';
import { Directories } from 'src/common/common.types';
import { Downloadable, DownloadJobs, MediaJob } from './downloads.types';

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

    const downloadDir = this.mediaConfig.getPath(Directories.DOWNLOADS);
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
}
