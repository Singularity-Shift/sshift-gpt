import 'multer';
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BucketService } from './bucket.service';
import { Response } from 'express';
import { AuthGuard, UserAuth } from '@nest-modules';
import { IUserAuth } from '@helpers';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('bucket')
@UseGuards(AuthGuard)
@ApiBearerAuth('Authorization')
export class BucketController {
  private readonly logger = new Logger(BucketController.name);

  constructor(private readonly bucketService: BucketService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImages(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/.*/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No files uploaded');
    }

    const response = this.bucketService.uploadImageToBucket(
      undefined,
      file.buffer
    );

    return response;
  }

  @Get('download/:filename')
  async downloadImage(
    @Param('filename') filename: string,
    @Res() res: Response,
    @UserAuth() userAuth: IUserAuth
  ) {
    this.logger.debug(`Download request for ${filename} by user ${userAuth.address}`);
    try {
      const stream = await this.bucketService.downloadImageFromBucket(filename);
      res.set({
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Type': 'application/octet-stream'
      });
      stream.pipe(res);
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`);
      res.status(404).json({ message: 'File not found' });
    }
  }

  // Implement bucket creation logic
}
