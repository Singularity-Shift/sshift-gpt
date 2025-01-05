import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateSoundEffectDto {
  @ApiProperty({
    description: 'Text to generate sound effect',
    example: 'Hello, I want to create a sound effect for my presentation',
  })
  @IsString()
  text: string;
  @ApiProperty({
    description: 'Duration of the sound effect in seconds',
    example: 3,
  })
  @IsNumber()
  duration_seconds: number;

  @ApiProperty({
    description: 'Prompt influence',
    example: 0.5,
  })
  prompt_influence: number;
}
