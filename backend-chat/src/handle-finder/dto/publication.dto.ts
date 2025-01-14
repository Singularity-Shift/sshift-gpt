import { ApiProperty } from '@nestjs/swagger';

export class PublicationDto {
  @ApiProperty({
    description: 'Publication ID',
    example: '1234567890',
  })
  publicationId: string;

  @ApiProperty({
    description: 'Publication title',
    example: 'The Evolution of Cryptography',
  })
  category: string;

  @ApiProperty({
    description: 'Reaction count for the publication',
    example: '100',
  })
  reactioncount: string;
}
