import { gql } from '@apollo/client';
import indexerClient from '../indexerClient';

const WALLET_COLLECTIONS_QUERY = gql`
  query fetchWalletItemsCollections($where: collections_bool_exp!, $order_by: [collections_order_by!]) {
    aptos {
      collections(where: $where, order_by: $order_by) {
        id
        slug
        semantic_slug
        title
        cover_url
        floor
      }
    }
  }
`;

async function fetchWalletItemsCollections(walletAddress) {
  console.log('Auth headers:', {
    userId: process.env.INDEXER_USER_ID,
    apiKey: process.env.INDEXER_API_KEY?.slice(0, 4) + '****' // Only log first 4 chars of API key for security
  });

  try {
    const { data, error } = await indexerClient.query({
      query: WALLET_COLLECTIONS_QUERY,
      variables: {
        where: {
          nfts: {
            _or: [
              {
                claimable_by: {
                  _eq: walletAddress
                }
              },
              {
                owner: {
                  _eq: walletAddress
                }
              }
            ]
          }
        },
        order_by: {
          title: "asc"
        }
      }
    });

    if (error) {
      throw new Error(`GraphQL Error: ${error.message}`);
    }

    // Convert floor prices to APT
    const collections = data?.aptos?.collections || [];
    return collections.map(collection => ({
      ...collection,
      floor: collection.floor * Math.pow(10, -8) // Convert to APT
    }));

  } catch (error) {
    console.error('Error with full details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Wallet address is required'
      });
    }

    try {
      const collections = await fetchWalletItemsCollections(wallet_address);
      res.status(200).json({
        status: 'success',
        data: collections
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
