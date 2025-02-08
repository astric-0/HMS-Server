import { File } from '../files.types';
import { readdir, stat } from 'fs/promises';
import { Dirent } from 'fs';
import { join, extname } from 'path';

export const readDirectory = async (path: string): Promise<File[]> => {
  const dirFiles = await readdir(path, { withFileTypes: true });

  const files: File[] = await Promise.all(
    dirFiles.map(async (file: Dirent): Promise<File> => {
      const filePath = join(path, file.name);
      const isDir = file.isDirectory();

      return {
        isDir,
        name: file.name,
        size: !isDir ? (await stat(filePath)).size : null,
        path: filePath,
        extension: extname(file.name),
      };
    }),
  );

  return files;
};
