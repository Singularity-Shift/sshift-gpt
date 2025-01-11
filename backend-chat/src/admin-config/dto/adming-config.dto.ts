import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { FeatureDto } from './feature.dto';

export class AdminConfigDto {
  static fromJson(models: FeatureDto[], tools: FeatureDto[], systemPrompt: string = ''): AdminConfigDto {
    return new AdminConfigDto(models, tools, systemPrompt);
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

  @ApiProperty({
    description: 'System prompt for the chat',
    type: String,
  })
  systemPrompt: string;

  constructor(models: FeatureDto[], tools: FeatureDto[], systemPrompt: string = '') {
    this.models = models;
    this.tools = tools;
    this.systemPrompt = systemPrompt;
  }
}
