import { gql } from '@apollo/client';

export const WALLET_COLLECTIONS_QUERY = gql`
  query fetchWalletItemsCollections(
    $where: collections_bool_exp!
    $order_by: [collections_order_by!]
  ) {
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
