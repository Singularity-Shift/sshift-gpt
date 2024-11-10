export const APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet';
export const RESOURCE_ACCOUNT_SEED =
  process.env.NEXT_PUBLIC_RESOURCE_ACCOUNT_SEED || '';
export const COIN_DECIMALS = parseInt(
  process.env.NEXT_PUBLIC_COIN_DECIMALS || '8'
);
