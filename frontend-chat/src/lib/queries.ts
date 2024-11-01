import { QueryClient } from '@tanstack/react-query';
import { aptosClient } from './utils';
import { ICollectionData, ICollectionQueryResult } from '@helpers';

export const queryClient = new QueryClient();

export const collectionDataQuery = (collection_id: string) => ({
  queryKey: ['app-state', collection_id],
  retry: 5,
  queryFn: async () => {
    try {
      if (!collection_id) return null;

      const res = await aptosClient().queryIndexer<ICollectionQueryResult>({
        query: {
          variables: {
            collection_id,
          },
          query: `
          query TokenQuery($collection_id: String) {
            current_collections_v2(
              where: { collection_id: { _eq: $collection_id } }
              limit: 1
            ) {
              creator_address
              collection_id
              collection_name
              current_supply
              max_supply
              uri
              description
              cdn_asset_uris {
                cdn_animation_uri
                cdn_image_uri
              }
            }
            current_collection_ownership_v2_view(
              where: { collection_id: { _eq: $collection_id } }
              order_by: { last_transaction_version: desc }
            ) {
              owner_address
            }
          }`,
        },
      });

      const collection = res.current_collections_v2[0];
      if (!collection) return null;

      return {
        collection,
      } satisfies ICollectionData;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
});
