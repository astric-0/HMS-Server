import {
  Body,
  Delete,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { File, FileAction, RouteInfo } from './files.types';
import { FilesService } from './files.service';
import { Directories } from 'src/common/common.types';
import { CheckIfBackwardsPath } from './files.helpers/check-if-backwards-path';

@Controller('files')
export class FilesController {
  constructor(@Inject() private readonly filesService: FilesService) {}

  @Get('directory/:rootDir')
  async getDirContents(
    @Param('rootDir') rootDir: Directories = Directories.DOWNLOADS,
    @Query('path') path: string = '',
  ) {
    const files: File[] = await this.filesService.getDirectoryFiles({
      rootDir,
      path: path.split(','),
    });

    return { files };
  }

  @Delete(':filename')
  async deleteFile(
    @Body() { source, isDir }: { source: RouteInfo; isDir: boolean },
    @Param('filename') filename: string,
  ) {
    if ((!source.path.length && !filename) || !source.rootDir) {
      throw new BadRequestException(
        'Source path and root dir are strictly required',
      );
    }

    if (CheckIfBackwardsPath(filename, source.rootDir, ...source.path))
      throw new BadRequestException("Can't include backwards path");

    try {
      await this.filesService.deleteFile(source, filename, isDir);
      return { message: 'File removed successfully' };
    } catch (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  @Patch(':filename/move')
  async performMoveAction(
    @Param('filename') filename: string,
    @Body() action: FileAction,
  ) {
    const result = await this.filesService.performMoveAction(filename, action);
    if (!result) throw new BadRequestException({ message: 'Invalid values' });
  }
}
