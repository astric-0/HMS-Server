import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { downloadMedia } from './media.helpers/downloadFile';
import { JOBS_NAMES, QUEUE_NAMES } from './media.constants';
import { Logger } from '@nestjs/common';

@Processor(QUEUE_NAMES.MEDIA_QUEUE)
export class MediaProcessor extends WorkerHost {
  private getJobProcessor(jobName: string): (job: Job) => any {
    switch (jobName) {
      case JOBS_NAMES.DOWNLOAD_MEDIA: {
        return downloadMedia;
      }
    }
  }

  public async process(job: Job): Promise<any> {
    const jobProcess = this.getJobProcessor(job.name);
    try {
      Logger.log(`JOB STARTED: ${job.name}`);
      Logger.log(`JOB DATA: ${JSON.stringify(job.data)}`);

      await jobProcess(job);
    } catch (error) {
      Logger.log(error);
    } finally {
      Logger.log('JOB ENDED');
    }
  }
}
