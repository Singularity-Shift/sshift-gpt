import { ApiProperty } from '@nestjs/swagger';

export class HandleDto {
  @ApiProperty({
    description: 'Handle name',
    example: 'john.doe',
  })
  localName: string;
}
