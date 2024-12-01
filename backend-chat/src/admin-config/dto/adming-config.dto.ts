import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ReqLimit } from '../req-limit.schema';
import { AdminConfig } from '../admin-config.schema';

export class AdminConfigDto {
  static fromJson(json: AdminConfig): AdminConfigDto {
    return new AdminConfigDto(json.models, json.tools);
  }

  @ApiProperty({
    description: 'Set request limit models for subscription',
    type: [ReqLimit],
  })
  @Type(() => ReqLimit)
  @ValidateNested({ each: true })
  models: ReqLimit[];

  @ApiProperty({
    description: 'Set request limit tools for subscription',
    type: [ReqLimit],
  })
  @Type(() => ReqLimit)
  @ValidateNested({ each: true })
  tools: ReqLimit[];

  constructor(models: ReqLimit[], tools: ReqLimit[]) {
    this.models = models;
    this.tools = tools;
  }
}
