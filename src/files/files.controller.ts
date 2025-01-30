import {
  Body,
  Delete,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { Action, StorageInfo, File } from './files.types';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(@Inject() private readonly filesService: FilesService) {}

  @Get()
  async getDownloadDirContents() {
    const [storageInfo, files]: [StorageInfo, File[]] = await Promise.all([
      this.filesService.getStorageInfo(),
      this.filesService.getJson(),
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

  @Patch(':filename/move')
  async performMoveAction(@Body() action: Action) {
    const result = await this.filesService.performMoveAction(action);
    if (!result) throw new BadRequestException({ message: 'Invalid values' });
  }
}
