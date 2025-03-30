import { ApiProperty } from '@nestjs/swagger';
import { ChatCompletionMessage } from 'openai/resources/chat';
import { CitationsDto } from './citations.dto';

export class GetSearchWebDto {
  static fromJson(
    json: ChatCompletionMessage,
    error: boolean
  ): GetSearchWebDto {
    return new GetSearchWebDto(
      error,
      json.content,
      json.annotations.map((a) =>
        CitationsDto.fromMap(a.url_citation.title, a.url_citation.url)
      )
    );
  }

  @ApiProperty({
    description: 'Error status',
    example: false,
  })
  error: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to fetch search result. Please try again later.',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Array of citations returned by the search process',
    type: CitationsDto,
  })
  citations: CitationsDto[];

  constructor(error: boolean, message: string, citations: CitationsDto[]) {
    this.error = error;
    this.message = message;
    this.citations = citations;
  }
}
