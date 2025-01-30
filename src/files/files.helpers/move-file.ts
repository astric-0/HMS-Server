import { rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';

export const moveFile = async (source: string, destination: string) => {
  if (!existsSync(source)) throw new Error("Couldn't find file");

  const destinationDir = dirname(destination);
  if (!existsSync(destination))
    await mkdir(destinationDir, { recursive: true });

  await rename(source, destination);
};
