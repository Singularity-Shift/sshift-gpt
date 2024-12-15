import { ApiProperty } from '@nestjs/swagger';
import { CreateActionDto } from './create-action.dto';

export class UpdateActionDto extends CreateActionDto {
  @ApiProperty({
    description: 'The reviewer signature',
    example: '0x0000000000000000000000000000000000000001',
  })
  signature: string;
}
