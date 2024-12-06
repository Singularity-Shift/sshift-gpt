import { IFeatureActivity, FeatureType } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class FeatureActivityDto {
  static fromJson(
    json: IFeatureActivity,
    creditType: FeatureType
  ): FeatureActivityDto {
    return new FeatureActivityDto(json.name, creditType, json.creditsUsed);
  }

  @ApiProperty({
    description: 'name of the model or tool',
    example: 'ChatGPT-0-1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of credit',
    example: FeatureType.Models,
  })
  @IsEnum(FeatureType)
  creditType: FeatureType;

  @ApiProperty({
    description: 'credit used',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  creditsUsed: number;

  constructor(name: string, creditType: FeatureType, creditsUsed?: number) {
    this.name = name;
    this.creditType = creditType;
    this.creditsUsed = creditsUsed;
  }
}
