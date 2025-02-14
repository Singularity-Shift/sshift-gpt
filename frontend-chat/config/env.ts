export const APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet';
export const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NODE_URL;
export const APTOS_INDEXER = process.env.NEXT_PUBLIC_APTOS_INDEXER || '';
export const RESOURCE_ACCOUNT_SEED =
  process.env.NEXT_PUBLIC_RESOURCE_ACCOUNT_SEED || '';
export const COIN_DECIMALS = parseInt(
  process.env.NEXT_PUBLIC_COIN_DECIMALS || '8'
);
export const QRIBBLE_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_QRIBBLE_NFT_ADDRESS || '';
export const SSHIFT_RECORD_ADDRESS =
  process.env.NEXT_PUBLIC_SSHIFT_RECORD_ADDRESS || '';
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '';
export const API_BACKEND_URL = process.env.API_BACKEND_URL || '';
