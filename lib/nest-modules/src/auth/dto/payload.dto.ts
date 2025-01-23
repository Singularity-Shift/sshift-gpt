import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PayloadDto {
  @ApiProperty({
    description: 'The signature from aptos account',
    example: '0x3134004959...',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Message signed by aptos account',
    example: '',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'The address',
    example: '0x504403204323...',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Public key of the account key',
    example: '0xfeefe4434333...',
  })
  publicKey: string;
}
