import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Technology',
  })
  category: string;

  @ApiProperty({
    description: 'Number of publications in the category',
    example: '1000',
  })
  count: string;
}
