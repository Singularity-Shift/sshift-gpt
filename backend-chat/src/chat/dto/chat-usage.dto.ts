import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ChatUsageDto {
  @ApiProperty({
    description: 'Number of characters used in the chat prompt',
    example: 124,
  })
  @IsNumber()
  prompt_tokens: number;

  @ApiProperty({
    description: 'Number of characters used in the completion',
    example: 318,
  })
  @IsNumber()
  completion_tokens: number;

  @ApiProperty({
    description: 'Number of characters used in the prompt and completion',
    example: 442,
  })
  @IsNumber()
  total_tokens: number;
}
