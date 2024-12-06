import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { Feature } from '../feature.schema';
import { AdminConfig } from '../admin-config.schema';

export class AdminConfigDto {
  static fromJson(json: AdminConfig): AdminConfigDto {
    return new AdminConfigDto(json?.models || [], json?.tools || []);
  }

  @ApiProperty({
    description: 'Set request limit models for subscription',
    type: [Feature],
  })
  @Type(() => Feature)
  @ValidateNested({ each: true })
  models: Feature[];

  @ApiProperty({
    description: 'Set request limit tools for subscription',
    type: [Feature],
  })
  @Type(() => Feature)
  @ValidateNested({ each: true })
  tools: Feature[];

  constructor(models: Feature[], tools: Feature[]) {
    this.models = models;
    this.tools = tools;
  }
}
