import { Directories } from 'src/common/common.types';
import { FileAction } from '../files.types';
import { join } from 'path';

export const getDestionationPath = (
  destinationInfo: FileAction['destination'],
): [boolean, string] => {
  const mediaTypeAssociatedLenghts = {
    [Directories.MOVIE]: 0,
    [Directories.MOVIE_SERIES]: 1,
    [Directories.SERIES]: 2,
  };

  if (
    destinationInfo.path.length !=
    mediaTypeAssociatedLenghts[destinationInfo.rootDir]
  )
    return [false, ''];

  return [true, join(...destinationInfo.path)];
};
