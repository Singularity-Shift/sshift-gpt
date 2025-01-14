import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class GetCategoryDto {
  static fromJson(json: CategoryDto): GetCategoryDto {
    return new GetCategoryDto(json.category, json.count);
  }

  @ApiProperty({
    description: 'Category name',
    example: 'Technology',
  })
  category: string;

  @ApiProperty({
    description: 'Number of publications in the category',
    example: '1000',
  })
  publications: string;

  constructor(category: string, publications: string) {
    this.category = category;
    this.publications = publications;
  }
}
