import { gql } from '@apollo/client';
import indexerClient from '../clients/indexerClient';

// Define GraphQL queries
const COLLECTION_SEARCH_QUERY = gql`
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

const COLLECTION_STATS_QUERY = gql`
    query fetchCollectionStats($slug: String!) {
        aptos {
            collection_stats(slug: $slug) {
                id: slug
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

const COLLECTION_DETAILS_QUERY = gql`
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

async function searchNftCollection(collectionName) {
    try {
        // Initial collection search
        const { data: searchData } = await indexerClient.query({
            query: COLLECTION_SEARCH_QUERY,
            variables: {
                text: collectionName,
                offset: 0,
                limit: 5
            }
        });

        // Normalize the search term
        const searchTerm = collectionName.toLowerCase()
            .replace(/^the\s+/i, '')
            .replace(/\s+/g, '-')
            .trim();
            
        // Find the first matching verified collection
        const foundCollection = searchData.aptos.collections.find(c => {
            if (!c.verified) return false;
            
            const normalizedTitle = c.title.toLowerCase()
                .replace(/^the\s+/i, '')
                .trim();
            
            const normalizedSlug = (c.semantic_slug || '').toLowerCase()
                .replace(/^the-/i, '')
                .trim();
            
            return normalizedTitle.includes(searchTerm) || 
                   searchTerm.includes(normalizedTitle) ||
                   normalizedSlug.includes(searchTerm) ||
                   searchTerm.includes(normalizedSlug);
        });
        
        if (!foundCollection) {
            return {
                status: 'not_found',
                message: `No verified collection found matching "${collectionName}". Please check the collection name and try again.`,
                search_term: collectionName
            };
        }

        // Create a mutable copy of the collection with converted values
        const collection = {
            ...foundCollection,
            floor: foundCollection.floor * Math.pow(10, -8),  // Convert to APT
            volume: foundCollection.volume * Math.pow(10, -8)  // Convert to APT
        };

        // Fetch stats and details in parallel
        const [statsResult, detailsResult] = await Promise.all([
            indexerClient.query({
                query: COLLECTION_STATS_QUERY,
                variables: {
                    slug: collection.slug
                }
            }),
            indexerClient.query({
                query: COLLECTION_DETAILS_QUERY,
                variables: {
                    slug: collection.slug
                }
            })
        ]);

        const stats = statsResult.data.aptos.collection_stats;
        const details = detailsResult.data.aptos.collections[0];

        // Add stats to collection object
        collection.stats = {
            total_sales: stats.total_sales,
            day_sales: stats.day_sales,
            day_volume: stats.day_volume * Math.pow(10, -8),
            day_usd_volume: stats.day_usd_volume
        };

        // Add details to collection object
        collection.details = {
            description: details.description,
            discord: details.discord,
            twitter: details.twitter,
            website: details.website
        };
        
        // Add formatted fields
        collection.formatted = {
            title: collection.title,
            floor_price: `${collection.floor} APT`,
            total_volume: `${collection.volume} APT`,
            usd_volume: `$${collection.usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            supply: `${collection.supply} NFTs`,
            verified: collection.verified,
            cover_url: formatImageUrl(collection.cover_url),

            total_sales: `${stats.total_sales} sales`,
            total_mints: `${stats.total_mints} mints`,
            total_mint_volume: `${stats.total_mint_volume * Math.pow(10, -8)} APT`,
            total_mint_usd_volume: `$${stats.total_mint_usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            
            day_stats: {
                volume: `${collection.stats.day_volume} APT`,
                sales: collection.stats.day_sales,
                usd_volume: `$${collection.stats.day_usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
            },

            social_links: {
                discord: details.discord || "Not available",
                twitter: details.twitter || "Not available",
                website: details.website || "Not available"
            },

            description: details.description || "No description available",
            slug: collection.slug,
            semantic_slug: collection.semantic_slug,

            marketplaces: {
                tradeport: `https://www.tradeport.xyz/aptos/collection/${collection.semantic_slug}?bottomTab=trades&tab=items`,
                wapal: `https://wapal.io/collection/${collection.title.replace(/\s+/g, '-')}`
            }
        };
        
        return {
            status: 'found',
            data: collection
        };

    } catch (error) {
        console.error('Failed to search NFT collection:', error);
        return {
            status: 'error',
            message: 'Failed to search NFT collection. Please try again later.',
            error: error.message
        };
    }
}

function formatImageUrl(url) {
    if (!url) return null;
    
    if (url.startsWith('ipfs://')) {
        const ipfsHash = url.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    return url;
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { collection_name } = req.body;

        if (!collection_name) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Collection name is required'
            });
        }

        try {
            const result = await searchNftCollection(collection_name);
            res.status(200).json(result);
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
