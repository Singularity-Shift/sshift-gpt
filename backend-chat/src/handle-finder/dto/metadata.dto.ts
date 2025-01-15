import { ApiProperty } from '@nestjs/swagger';
import { CoverPictureDto } from './cover-picture.dto';
import { PictureDto } from './picture.dto';

export class MetadataDto {
  @ApiProperty({
    description: 'Cover picture data',
    type: CoverPictureDto,
  })
  coverPicture: CoverPictureDto;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'User profile picture',
    type: PictureDto,
  })
  picture: PictureDto;

  @ApiProperty({
    description: 'User bio',
    example: 'I love coding and photography.',
  })
  bio: string;
}
