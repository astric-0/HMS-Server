import { Dirent, Stats } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export const getDirectorySize = async (dirPath: string): Promise<number> => {
  try {
    const files = await readdir(dirPath, { withFileTypes: true });

    const data: { files: Dirent[]; dirs: Dirent[] } = files.reduce(
      (acc: { files: Dirent[]; dirs: Dirent[] }, curr: Dirent) => {
        if (curr.isDirectory()) acc.dirs.push(curr);
        else acc.files.push(curr);
        return acc;
      },
      { files: [], dirs: [] },
    );

    const [filesStats, directorySums]: [Stats[], number[]] = await Promise.all([
      Promise.all(
        data.files.map(async (file: Dirent) => {
          try {
            const filePath = join(dirPath, file.name);
            return await stat(filePath);
          } catch {
            return { size: 0 } as Stats;
          }
        }),
      ),
      Promise.all(
        data.dirs.map(async (dir): Promise<number> => {
          try {
            return await getDirectorySize(join(dirPath, dir.name));
          } catch {
            return 0;
          }
        }),
      ),
    ]);

    const dirsTotal: number = directorySums.reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    );
    const filesTotal: number = filesStats.reduce(
      (acc: number, curr: Stats) => curr.size + acc,
      0,
    );

    return dirsTotal + filesTotal;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
