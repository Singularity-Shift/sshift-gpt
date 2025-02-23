import { Injectable } from '@nestjs/common';
import { GenerateDTO } from './dto/generate.dto';
import { BucketService, ConfigService } from '@nest-modules';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IdeogramService {
  private baseUrl: string;
  private apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly bucketService: BucketService
  ) {
    this.baseUrl = this.configService.get('ideogram.baseUrl');
    this.apiKey = this.configService.get('ideogram.apiKey');
  }
  async generateIdeogram(generateDto: GenerateDTO) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/generate`,
        {
          image_request: generateDto,
        },
        {
          headers: {
            'Api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const imageData = response.data?.data?.[0];

    const { url } = await this.bucketService.uploadImageToBucket(imageData.url);

    return {
      ...imageData,
      url,
    };
  }
}
