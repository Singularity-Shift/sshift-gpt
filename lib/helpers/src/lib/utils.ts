export const transformCoverUrl = (url: string) => {
  if (!url) return null;

  // Handle IPFS URLs
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }

  // Handle Aptos Names API URLs
  if (url.includes('aptos-names-api')) {
    // The URL is already in the correct format for direct access
    return url;
  }

  return url;
};
