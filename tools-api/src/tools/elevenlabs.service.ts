import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nest-modules';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ElevenLabsService {
  private logger = new Logger(ElevenLabsService.name);
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
            text,
            duration_seconds,
            prompt_influence,
          },
          {
            headers,
            responseType: 'arraybuffer',
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('ElevenLabs API error', error.response?.data);
      throw error;
    }
  }
}
