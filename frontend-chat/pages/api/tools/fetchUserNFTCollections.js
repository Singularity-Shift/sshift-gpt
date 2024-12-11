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

async function fetchWalletItemsCollections(address) {
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
      floor: collection.floor * Math.pow(10, -8) // Convert to APT
    }));

  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the address directly from req.userConfig
      const address = req.userConfig?.address;
      
      if (!address) {
        return res.status(400).json({
          status: 'error',
          message: 'No wallet address found in user configuration'
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

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
