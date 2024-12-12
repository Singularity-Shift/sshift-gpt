export interface NFTCollection {
  id: string;
  slug: string;
  title: string;
  cover_url: string;
  floor: number;
  verified: boolean;
  volume: number;
  description?: string;
  creator?: string;
  supply?: number;
  minted?: number;
  traits?: NFTTrait[];
  items?: NFTItem[];
}

export interface NFTTrait {
  name: string;
  value: string;
  rarity?: number;
}

export interface NFTItem {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  traits?: NFTTrait[];
  owner?: string;
  last_price?: number;
  last_sale_date?: string;
} 