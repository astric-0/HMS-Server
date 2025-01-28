import { MediaType } from 'src/common/types';
import { Action } from '../downloads.types';
import { join } from 'path';

export const getDestionationPath = (
  destinationInfo: Action['destinationInfo'],
): [boolean, string] => {
  const mediaTypeAssociatedLenghts = {
    [MediaType.MOVIE]: 0,
    [MediaType.MOVIE_SERIES]: 1,
    [MediaType.SERIES]: 2,
  };

  if (
    destinationInfo.path.length !=
    mediaTypeAssociatedLenghts[destinationInfo.moveTo]
  )
    return [false, ''];

  return [true, join(...destinationInfo.path)];
};
