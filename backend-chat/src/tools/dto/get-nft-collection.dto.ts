import { ApiProperty } from '@nestjs/swagger';

const nftCollection = {
  id: 'add92613-5822-44a2-84a4-93a6fa6637ff',
  supply: 3333,
  floor: 0.399,
  slug: '0xb800fc646ff816358eb759b5abaeb8743d08ee52dfcf0c20e21a54107b21f8a',
  semantic_slug: 'qribbles',
  title: 'Qribbles',
  usd_volume: 12128.65014326598,
  volume: 1264.4585491,
  cover_url: 'ipfs://QmVBbAs6YRK1j6BowuNYFg2T8GY9st9vGsvsLQSJCSbWpw',
  verified: true,
  __typename: 'collections',
  stats: {
    total_sales: 1568,
    day_sales: 0,
    day_volume: 0,
    day_usd_volume: '0',
  },
  details: {
    description:
      'A collection from SShift DAO - Before the arrival of Quark (), the Qribbles, a delightful swarm of luminescent creatures, are sent forth. These effervescent emissaries of joy weave through the cities and wilds of each new world, their mere presence a balm to the soul, fostering love and mirth in their wake. They are the precursors of the age of Quark, the soft light before the dawn of a new era.',
    discord: 'https://discord.gg/ekPT3USjsD',
    twitter: 'https://twitter.com/SShift_NFT',
    website: 'www.sshift.xyz',
  },
  formatted: {
    title: 'Qribbles',
    floor_price: '0.399 APT',
    total_volume: '1264.4585491 APT',
    usd_volume: '$12.128,65',
    supply: '3333 NFTs',
    verified: true,
    cover_url:
      'https://ipfs.io/ipfs/QmVBbAs6YRK1j6BowuNYFg2T8GY9st9vGsvsLQSJCSbWpw',
    total_sales: '1568 sales',
    total_mints: '3334 mints',
    total_mint_volume: '1934.19999893 APT',
    total_mint_usd_volume: '$20071.4120892114707805',
    day_stats: {
      volume: '0 APT',
      sales: 0,
      usd_volume: '$0',
    },
    social_links: {
      discord: 'https://discord.gg/ekPT3USjsD',
      twitter: 'https://twitter.com/SShift_NFT',
      website: 'www.sshift.xyz',
    },
    description:
      'A collection from SShift DAO - Before the arrival of Quark (), the Qribbles, a delightful swarm of luminescent creatures, are sent forth. These effervescent emissaries of joy weave through the cities and wilds of each new world, their mere presence a balm to the soul, fostering love and mirth in their wake. They are the precursors of the age of Quark, the soft light before the dawn of a new era.',
    slug: '0xb800fc646ff816358eb759b5abaeb8743d08ee52dfcf0c20e21a54107b21f8a',
    semantic_slug: 'qribbles',
    marketplaces: {
      tradeport:
        'https://www.tradeport.xyz/aptos/collection/qribbles?bottomTab=trades&tab=items',
      wapal: 'https://wapal.io/collection/Qribbles',
    },
  },
};

export class GetNFTCollectionDto {
  @ApiProperty({
    description: 'Search status',
    example: 'found',
  })
  status: string;

  @ApiProperty({
    description: 'NFT collection details',
    example: nftCollection,
    required: false,
  })
  data?: object;

  @ApiProperty({
    description: 'Error details',
    example: 'Error fetching NFT collection data.',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Message',
    example: 'Failed to search NFT collection. Please try again later.',
    required: false,
  })
  message?: string;
}
