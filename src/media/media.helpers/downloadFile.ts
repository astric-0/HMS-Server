import { Job } from 'bullmq';
import { unlinkSync, createWriteStream, mkdirSync } from 'fs';
import * as https from 'https';
import { dirname } from 'path';
import { Downloadable } from '../media.types';

export async function downloadMedia(job: Job<Downloadable>): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const { url, filePath } = job.data;

    try {
      // Ensure parent directory exists
      mkdirSync(dirname(filePath), { recursive: true });
    } catch (error) {
      return reject(`Failed to create directories for ${filePath}: ${error}`);
    }

    const fileStream = createWriteStream(filePath);
    let downloadedBytes = 0;

    const request = https.get(url, (response) => {
      const totalBytes = parseInt(
        response.headers['content-length'] || '0',
        10,
      );

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);

        const progress = Math.round((downloadedBytes / totalBytes) * 100);
        job.updateProgress(progress);
      });

      response.on('end', () => {
        fileStream.end();
        resolve(true);
      });

      response.on('error', (error) => {
        fileStream.close();
        unlinkSync(filePath);
        reject(error);
      });
    });

    request.on('error', (error) => {
      fileStream.close();
      unlinkSync(filePath);
      reject(error);
    });

    fileStream.on('error', (error) => {
      unlinkSync(filePath);
      reject(error);
    });
  });
}
