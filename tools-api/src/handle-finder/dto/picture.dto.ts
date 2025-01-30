import { ApiProperty } from '@nestjs/swagger';
import { RawDto } from './raw.dto';

export class PictureDto {
  @ApiProperty({
    type: RawDto,
    description: 'Raw picture data',
  })
  raw: RawDto;
}
