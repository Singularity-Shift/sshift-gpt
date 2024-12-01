import { IReqUsed, ReqType } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class ReqUsedDto {
  static fromJson(json: IReqUsed, reqType: ReqType): ReqUsedDto {
    return new ReqUsedDto(json.name, reqType, json.reqUsed);
  }

  @ApiProperty({
    description: 'name of the model or tool',
    example: 'ChatGPT-0-1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of req',
    example: ReqType.Model,
  })
  @IsEnum(ReqType)
  reqType: ReqType;

  @ApiProperty({
    description: 'req used',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  reqUsed: number;

  constructor(name: string, reqType: ReqType, reqUsed?: number) {
    this.name = name;
    this.reqType = reqType;
    this.reqUsed = reqUsed;
  }
}
