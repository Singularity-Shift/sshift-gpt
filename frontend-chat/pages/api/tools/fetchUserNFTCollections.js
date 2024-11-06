import { gql } from '@apollo/client';
import indexerClient from '../indexerClient';
import { jwtDecode } from 'jwt-decode';

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
        verified
      }
    }
  }
`;

async function fetchWalletItemsCollections(token) {
  if (!token) {
    throw new Error('No wallet connected - please connect your wallet first');
  }

  // Decode the JWT to get the wallet address
  const decoded = jwtDecode(token);
  const walletAddress = decoded.address;

  if (!walletAddress) {
    throw new Error('No wallet address found in session');
  }

  console.log('Auth headers:', {
    userId: process.env.INDEXER_USER_ID,
    apiKey: process.env.INDEXER_API_KEY?.slice(0, 4) + '****'
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
    try {
      // Get JWT from the request cookies or authorization header
      const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'No authentication token found'
        });
      }

      const collections = await fetchWalletItemsCollections(token);
      res.status(200).json({
        status: 'success',
        data: collections
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal Server Error',
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
