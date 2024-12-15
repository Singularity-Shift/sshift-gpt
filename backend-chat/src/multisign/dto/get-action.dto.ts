import { ApiProperty } from '@nestjs/swagger';
import { CreateActionDto } from './create-action.dto';
import { Multisign } from '../multisign.schema';
import { MultisignAction } from '@helpers';

export class GetActionDto extends CreateActionDto {
  static fromJson(json: Multisign): GetActionDto {
    return new GetActionDto(
      json.action,
      json.signature,
      json.targetAddress,
      json.transaction
    );
  }

  @ApiProperty({
    description: 'The reviewer signature',
    example: '0x0000000000000000000000000000000000000001',
  })
  signature: string;

  constructor(
    action: MultisignAction,
    signature: string,
    targetAddress: string,
    transaction: string
  ) {
    super(action, transaction, targetAddress);
    this.signature = signature;
  }
}
