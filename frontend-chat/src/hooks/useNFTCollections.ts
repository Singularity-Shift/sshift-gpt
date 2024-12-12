import { useEffect, useState } from 'react';
import { useAppManagement } from '../context/AppManagment';

interface NFTCollection {
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

interface NFTTrait {
  name: string;
  value: string;
  rarity?: number;
}

interface NFTItem {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  traits?: NFTTrait[];
  owner?: string;
  last_price?: number;
  last_sale_date?: string;
}

/**
 * React hook for UI components to fetch and display NFT collections
 * This is separate from the API route that the AI uses
 */
export const useNFTCollections = () => {
  const { walletAddress } = useAppManagement();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!walletAddress) {
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
  }, [walletAddress]);

  return { collections, loading, error };
}; 