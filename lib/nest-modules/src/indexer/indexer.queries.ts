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

export const COLLECTION_SEARCH_QUERY = gql`
  query collectionSearch($text: String, $offset: Int, $limit: Int) {
    aptos {
      collections: collections_search(
        args: { text: $text }
        offset: $offset
        limit: $limit
      ) {
        id
        supply
        floor
        slug
        semantic_slug
        title
        usd_volume
        volume
        cover_url
        verified
      }
    }
  }
`;

export const COLLECTION_STATS_QUERY = gql`
  query fetchCollectionStats($slug: String!) {
    aptos {
      collection_stats(slug: $slug) {
        total_mint_volume
        total_mint_usd_volume
        total_mints
        total_sales
        total_usd_volume
        total_volume
        day_volume
        day_sales
        day_usd_volume
      }
    }
  }
`;

export const COLLECTION_DETAILS_QUERY = gql`
  query fetchCollectionWithoutNfts($slug: String) {
    aptos {
      collections(
        where: {
          _or: [{ semantic_slug: { _eq: $slug } }, { slug: { _eq: $slug } }]
        }
      ) {
        id
        description
        discord
        twitter
        website
      }
    }
  }
`;

export const TRENDING_COLLECTIONS_QUERY = gql`
  query fetchTrendingCollections(
    $period: TrendingPeriod!
    $trending_by: TrendingBy!
    $offset: Int = 0
    $limit: Int!
  ) {
    aptos {
      collections_trending(
        period: $period
        trending_by: $trending_by
        offset: $offset
        limit: $limit
      ) {
        id: collection_id
        current_trades_count
        current_usd_volume
        current_volume
        previous_trades_count
        previous_usd_volume
        previous_volume
        collection {
          id
          slug
          semantic_slug
          title
          supply
          cover_url
          floor
          usd_volume
          volume
          verified
        }
      }
    }
  }
`;

// Sui Queries
export const SUI_COLLECTION_SEARCH_QUERY = gql`
  query suiCollectionSearch($text: String, $offset: Int, $limit: Int) {
    sui {
      collections: collections_search(
        args: { text: $text }
        offset: $offset
        limit: $limit
      ) {
        id
        supply
        floor
        slug
        semantic_slug
        title
        usd_volume
        volume
        cover_url
        verified
      }
    }
  }
`;

export const SUI_COLLECTION_STATS_QUERY = gql`
  query fetchSuiCollectionStats($slug: String!) {
    sui {
      collection_stats(slug: $slug) {
        total_mint_volume
        total_mint_usd_volume
        total_mints
        total_sales
        total_usd_volume
        total_volume
        day_volume
        day_sales
        day_usd_volume
      }
    }
  }
`;

export const SUI_COLLECTION_DETAILS_QUERY = gql`
  query fetchSuiCollectionWithoutNfts($slug: String) {
    sui {
      collections(
        where: {
          _or: [{ semantic_slug: { _eq: $slug } }, { slug: { _eq: $slug } }]
        }
      ) {
        id
        description
        discord
        twitter
        website
      }
    }
  }
`;

export const SUI_TRENDING_COLLECTIONS_QUERY = gql`
  query fetchSuiTrendingCollections(
    $period: TrendingPeriod!
    $trending_by: TrendingBy!
    $offset: Int = 0
    $limit: Int!
  ) {
    sui {
      collections_trending(
        period: $period
        trending_by: $trending_by
        offset: $offset
        limit: $limit
      ) {
        id: collection_id
        current_trades_count
        current_usd_volume
        current_volume
        previous_trades_count
        previous_usd_volume
        previous_volume
        collection {
          id
          slug
          semantic_slug
          title
          supply
          cover_url
          floor
          usd_volume
          volume
          verified
        }
      }
    }
  }
`;

// Movement Queries
export const MOVEMENT_COLLECTION_SEARCH_QUERY = gql`
  query movementCollectionSearch($text: String, $offset: Int, $limit: Int) {
    movement {
      collections: collections_search(
        args: { text: $text }
        offset: $offset
        limit: $limit
      ) {
        id
        supply
        floor
        slug
        semantic_slug
        title
        usd_volume
        volume
        cover_url
        verified
      }
    }
  }
`;

export const MOVEMENT_COLLECTION_STATS_QUERY = gql`
  query fetchMovementCollectionStats($slug: String!) {
    movement {
      collection_stats(slug: $slug) {
        total_mint_volume
        total_mint_usd_volume
        total_mints
        total_sales
        total_usd_volume
        total_volume
        day_volume
        day_sales
        day_usd_volume
      }
    }
  }
`;

export const MOVEMENT_COLLECTION_DETAILS_QUERY = gql`
  query fetchMovementCollectionWithoutNfts($slug: String) {
    movement {
      collections(
        where: {
          _or: [{ semantic_slug: { _eq: $slug } }, { slug: { _eq: $slug } }]
        }
      ) {
        id
        description
        discord
        twitter
        website
      }
    }
  }
`;

export const MOVEMENT_TRENDING_COLLECTIONS_QUERY = gql`
  query fetchMovementTrendingCollections(
    $period: TrendingPeriod!
    $trending_by: TrendingBy!
    $offset: Int = 0
    $limit: Int!
  ) {
    movement {
      collections_trending(
        period: $period
        trending_by: $trending_by
        offset: $offset
        limit: $limit
      ) {
        id: collection_id
        current_trades_count
        current_usd_volume
        current_volume
        previous_trades_count
        previous_usd_volume
        previous_volume
        collection {
          id
          slug
          semantic_slug
          title
          supply
          cover_url
          floor
          usd_volume
          volume
          verified
        }
      }
    }
  }
`;
