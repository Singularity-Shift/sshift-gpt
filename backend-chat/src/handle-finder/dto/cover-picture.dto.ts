import { ApiProperty } from '@nestjs/swagger';
import { OptimizedDto } from './optimized.dto';

export class CoverPictureDto {
  @ApiProperty({
    type: OptimizedDto,
    description: 'Cover picture data',
  })
  optimized: OptimizedDto;
}
