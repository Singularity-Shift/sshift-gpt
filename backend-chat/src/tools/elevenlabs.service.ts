import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../share/config/config.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ElevenLabsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  // Sound effect generation method
  async generateSoundEffect(
    text: string,
    duration_seconds: number,
    prompt_influence: number
  ) {
    const url = this.configService.get<string>('eleven.url');
    const headers = {
      'xi-api-key': this.configService.get<string>('eleven.apiKey'),
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            prompt: text,
            duration_seconds,
            prompt_influence,
          },
          {
            headers,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs API error', error);
      throw error;
    }
  }
}
