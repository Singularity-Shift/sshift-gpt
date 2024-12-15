import { gql } from '@apollo/client';
import indexerClient from '../clients/indexerClient';

const WALLET_COLLECTIONS_QUERY = gql`
  query fetchWalletItemsCollections($where: collections_bool_exp!, $order_by: [collections_order_by!]) {
    aptos {
      collections(where: $where, order_by: $order_by) {
        id
        slug
        title
        cover_url
        floor
        verified
        volume
      }
    }
  }
`;

function transformCoverUrl(url) {
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
}

async function fetchWalletItemsCollections(address) {
  if (!address) {
    throw new Error('No wallet connected');
  }

  try {
    const { data } = await indexerClient.query({
      query: WALLET_COLLECTIONS_QUERY,
      variables: {
        where: {
          nfts: {
            _or: [{ owner: { _eq: address } }]
          }
        },
        order_by: [{ volume: 'desc' }]
      }
    });

    const collections = data?.aptos?.collections || [];
    return collections.map(collection => ({
      ...collection,
      floor: collection.floor * Math.pow(10, -8), // Convert to APT
      volume: collection.volume * Math.pow(10, -8), // Convert to APT
      cover_url: transformCoverUrl(collection.cover_url)
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('Request received:', {
      method: req.method,
      headers: req.headers
    });

    // Get userConfig from headers
    let userConfig;
    try {
      userConfig = req.headers['x-user-config'] ? JSON.parse(req.headers['x-user-config']) : null;
    } catch (e) {
      console.error('Error parsing user config from headers:', e);
    }

    console.log('Extracted userConfig from headers:', userConfig);
    
    const address = userConfig?.address;
    console.log('Extracted address:', address);

    if (!address) {
      console.log('No address found in userConfig');
      return res.status(400).json({
        status: 'error',
        message: 'No wallet connected'
      });
    }

    const collections = await fetchWalletItemsCollections(address);
    return res.status(200).json({
      status: 'success',
      data: collections
    });
  } catch (error) {
    console.error('Error in fetchUserNFTCollections:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
}
