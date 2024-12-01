import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { IUserConfig } from '@helpers';
import { ReqUsedDto } from './req-used.dto';

export class GetUserConfigDto {
  @ApiProperty({
    description: 'Address of the aptos account',
    example:
      '0x1cdcbae7369dc8e159bc8bf951cfb7e7e168ef1bd56c169dcacb336b13657417',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'If user has active subscription plan',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'If user is admin',
    example: true,
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'If user fees collector',
    example: false,
  })
  isCollector: boolean;

  @ApiProperty({
    description: 'Request made to each model by user',
    type: [ReqUsedDto],
  })
  @Type(() => ReqUsedDto)
  @ValidateNested({ each: true })
  modelsActivity: ReqUsedDto[];

  @ApiProperty({
    description: 'request made to each model by user',
    type: [ReqUsedDto],
  })
  @Type(() => ReqUsedDto)
  @ValidateNested({ each: true })
  toolsActivity: ReqUsedDto[];

  static fromJson(
    address: string,
    userConfig: IUserConfig,
    modelsActivity: ReqUsedDto[],
    toolsActivity: ReqUsedDto[]
  ): GetUserConfigDto {
    return new GetUserConfigDto(
      address,
      userConfig.subscriptionPlan.active,
      userConfig.isAdmin,
      userConfig.isCollector,
      modelsActivity,
      toolsActivity
    );
  }
  constructor(
    address: string,
    active: boolean,
    isAdmin: boolean,
    isCollector: boolean,
    modelsAtivity: ReqUsedDto[],
    toolsActivity: ReqUsedDto[]
  ) {
    this.address = address;
    this.active = active;
    this.isAdmin = isAdmin;
    this.isCollector = isCollector;
    this.modelsActivity = modelsAtivity;
    this.toolsActivity = toolsActivity;
  }
}
