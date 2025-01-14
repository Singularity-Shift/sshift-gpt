import { ApiProperty } from '@nestjs/swagger';

export class TopicDto {
  @ApiProperty({
    description: 'Topic id',
    example: '12345678-90ab-cdef-1234-567890abcdef12',
  })
  id: string;
  @ApiProperty({
    description: 'Date of the publication',
    example: '2022-01-01T12:00:00.000Z',
  })
  date: Date;
  @ApiProperty({
    description: 'Topic name',
    example: 'Artificial Intelligence',
  })
  topic: string;
  @ApiProperty({
    description: 'Number of appearances of the topic',
    example: '1000',
  })
  appearances: string;
  @ApiProperty({
    description: 'Topic description',
    example: 'This is a sample topic content.',
  })
  description: string;
  @ApiProperty({
    description: 'Cluster id of the topic',
    example: '0x12345678-90ab-cdef-1234-567890abcdef12',
  })
  cluster_id: string;
  @ApiProperty({
    description: 'Section of the topic',
    example: 'Technology',
  })
  section: string;
  @ApiProperty({
    description: 'Short description of the topic',
    example: 'Sample short topic description.',
  })
  short_description: string;
  @ApiProperty({
    description: 'Pain summary of the topic',
    example: 'Sample pain summary.',
  })
  pain_summary: string;
  @ApiProperty({
    description: 'Happy summary of the topic',
    example: 'Sample happy summary.',
  })
  happy_summary: string;
  @ApiProperty({
    description: 'Number of publications related to the topic',
    example: '100',
  })
  publicationcount: string;
}
