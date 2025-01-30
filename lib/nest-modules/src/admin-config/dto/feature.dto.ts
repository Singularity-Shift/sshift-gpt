import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Feature } from '../feature.schema';

export class FeatureDto {
  static fromJson(feature: Feature): FeatureDto {
    return new FeatureDto(feature.name, feature.credits);
  }

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

  constructor(name: string, credits: number) {
    this.name = name;
    this.credits = credits;
  }
}
