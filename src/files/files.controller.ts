import {
  Body,
  Delete,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  //Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  StorageInfo,
  File,
  //FileAction
} from './files.types';
import { FilesService } from './files.service';
import { Directories } from 'src/common/common.types';

@Controller('files')
export class FilesController {
  constructor(@Inject() private readonly filesService: FilesService) {}

  @Get('directory/:rootDir')
  async getDirContents(
    @Param('rootDir') rootDir: Directories = Directories.DOWNLOADS,
    @Query('path') path: string = '',
  ) {
    const [storageInfo, files]: [StorageInfo, File[]] = await Promise.all([
      this.filesService.getStorageInfo(),
      this.filesService.getDirectoryFiles({ rootDir, path: path.split(',') }),
    ]);

    return { files, storageInfo };
  }

  @Delete()
  async deleteFile(@Body() file: File) {
    if (!file.name) throw new BadRequestException('Invalid file name');
    try {
      this.filesService.deleteFile(file);
      return { message: 'File removed successfully' };
    } catch (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  // @Patch(':filename/move')
  // async performMoveAction(@Body() action: FileAction) {
  //   const result = await this.filesService.performMoveAction(action);
  //   if (!result) throw new BadRequestException({ message: 'Invalid values' });
  // }
}
