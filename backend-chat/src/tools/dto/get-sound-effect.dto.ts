import { ISoundEffect } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';

export class GetSoundEffect {
  static fromJson(json: ISoundEffect): GetSoundEffect {
    return new GetSoundEffect(
      json.url,
      json.duration_seconds,
      json.text,
      json.prompt,
      json.description
    );
  }

  @ApiProperty({
    description: 'URL of the sound effect',
    example: 'https://example.com/sound_effect.mp3',
  })
  url: string;

  @ApiProperty({
    description: 'Duration of the sound effect in seconds',
    example: 3,
  })
  duration_seconds: string | number;

  @ApiProperty({
    description: 'Text to be spoken by the sound effect',
    example: 'Hello world',
  })
  text: string;

  @ApiProperty({
    description: 'Prompt for generating the sound effect',
    example: 'en-US_MichaelVoice',
  })
  prompt: string;

  @ApiProperty({
    description: 'Detail of the sound effect',
    example: 'the sound effect is of a happy tone',
  })
  description: string;

  constructor(
    url: string,
    duration_seconds: string | number,
    text: string,
    prompt: string,
    description: string
  ) {
    this.url = url;
    this.duration_seconds = duration_seconds;
    this.text = text;
    this.prompt = prompt;
    this.description = description;
  }
}
