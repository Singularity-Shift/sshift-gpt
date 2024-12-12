import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface NFTCollection {
  id: string;
  slug: string;
  title: string;
  cover_url: string;
  floor: number;
  verified: boolean;
  volume: number;
}

/**
 * React hook for UI components to fetch and display NFT collections
 * This is separate from the API route that the AI uses
 */
export const useNFTCollections = () => {
  const { account, connected } = useWallet();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!connected || !account?.address) {
        setCollections([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tools/fetchUserNFTCollections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch NFT collections');
        }

        const { data } = await response.json();
        setCollections(data);
      } catch (err) {
        console.error('Error fetching NFT collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFT collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [connected, account?.address]);

  return { collections, loading, error };
}; 