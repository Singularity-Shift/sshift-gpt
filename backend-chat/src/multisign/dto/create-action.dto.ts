import { MultisignAction } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateActionDto {
  @ApiProperty({
    enum: MultisignAction,
    description: 'The action to be performed on the multisign',
    example: MultisignAction.AddCollector,
    required: true,
  })
  @IsEnum(MultisignAction)
  action: MultisignAction;

  @ApiProperty({
    description: 'The transaction hash for the action',
    example: '0x0000000000000000000000000000000000000001',
  })
  transaction: string;

  @ApiProperty({
    description: 'The address which the action is performed on',
    example: '0x504403204323...',
  })
  @IsOptional()
  @IsString()
  targetAddress: string;

  constructor(
    action: MultisignAction,
    transaction: string,
    targetAddress?: string
  ) {
    this.action = action;
    this.targetAddress = targetAddress;
    this.transaction = transaction;
  }
}
