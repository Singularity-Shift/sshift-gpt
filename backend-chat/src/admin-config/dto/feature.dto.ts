import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FeatureDto {
  @ApiProperty({
    description: 'Name of model or tool',
    example: 'system',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'max of requests allowed per subscription',
    example: 100,
  })
  credits: number;
}
