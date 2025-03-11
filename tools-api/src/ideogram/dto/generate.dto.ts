import { ApiProperty } from '@nestjs/swagger';

export class GenerateDTO {
  @ApiProperty({
    description:
      'A description of the scene that you want to create. This should be a concise and imaginative sentence that tells a story about the scene. For example, "A serene tropical beach',
    example:
      'A serene tropical beach scene. Dominating the foreground are tall palm trees with lush green leaves, standing tall against a backdrop of a sandy beach. The beach leads to the azure waters of the sea, which gently kisses the shoreline. In the distance, there is an island or landmass with a silhouette of what appears to be a lighthouse or tower. The sky above is painted with fluffy white clouds, some of which are tinged with hues of pink and orange, suggesting either a sunrise or sunset.',
  })
  prompt: string;
  @ApiProperty({
    description:
      'The desired ration of the generated image. The aspect ratio should be a ratio of width to height, such as 16:9 or 10:16',
    example: 'ASPECT_10_16',
  })
  aspect_ratio: string;
  @ApiProperty({
    description: 'Model to use for generating the image.',
    example: 'V_2',
  })
  model: string;
  @ApiProperty({
    description: 'Mode for the magic prompt',
    example: 'AUTO',
  })
  magic_prompt_option: 'AUTO';

  @ApiProperty({
    description: 'Seed for generating the image.',
    example: 123456789,
  })
  seed: number;

  @ApiProperty({
    description: 'Style of the generated image',
    example: 'COLORFUL',
  })
  style_type: string;
}
