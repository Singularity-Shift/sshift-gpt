import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ActionsDto {
  @ApiProperty({
    description: 'The prompt for the Aptos agent',
    example: 'What is the weather like today?',
  })
  @IsString()
  prompt: string;
}
