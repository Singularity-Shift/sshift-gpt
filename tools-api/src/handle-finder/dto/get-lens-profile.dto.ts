import { ApiProperty } from '@nestjs/swagger';
import { HandleDto } from './handle.dto';
import { MetadataDto } from './metadata.dto';
import { StatsDto } from './stats.dto';

export class GetLensProfileDto {
  @ApiProperty({
    description: 'Lens profile ID',
    example: '0x13',
  })
  id: string;

  @ApiProperty({
    description: 'User handle',
    type: HandleDto,
  })
  handle: HandleDto;

  @ApiProperty({
    description: 'User metadata',
    type: MetadataDto,
  })
  metadata: MetadataDto;

  @ApiProperty({
    description: 'User stats',
    type: StatsDto,
  })
  stats: StatsDto;
}
