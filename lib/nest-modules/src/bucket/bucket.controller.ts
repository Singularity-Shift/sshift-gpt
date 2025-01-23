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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BucketService } from './bucket.service';

@Controller('bucket')
export class BucketController {
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
  // Implement bucket creation logic
}
