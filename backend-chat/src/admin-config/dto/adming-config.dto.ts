import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { FeatureDto } from './feature.dto';

export class AdminConfigDto {
  static fromJson(models: FeatureDto[], tools: FeatureDto[]): AdminConfigDto {
    return new AdminConfigDto(models, tools);
  }

  @ApiProperty({
    description: 'Set request limit models for subscription',
    type: [FeatureDto],
  })
  @Type(() => FeatureDto)
  @ValidateNested({ each: true })
  models: FeatureDto[];

  @ApiProperty({
    description: 'Set request limit tools for subscription',
    type: [FeatureDto],
  })
  @Type(() => FeatureDto)
  @ValidateNested({ each: true })
  tools: FeatureDto[];

  constructor(models: FeatureDto[], tools: FeatureDto[]) {
    this.models = models;
    this.tools = tools;
  }
}
