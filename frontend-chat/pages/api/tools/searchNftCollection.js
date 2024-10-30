async function searchNftCollection(collectionName) {
    try {
        const searchQuery = `
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

        const searchResponse = await fetch('https://api.indexer.xyz/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-user': process.env.INDEXER_USER_ID,
                'x-api-key': process.env.INDEXER_API_KEY
            },
            body: JSON.stringify({
                query: searchQuery,
                variables: {
                    text: collectionName,
                    offset: 0,
                    limit: 5
                }
            })
        });

        if (!searchResponse.ok) {
            throw new Error(`Network response was not ok: ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();

        if (searchData.errors) {
            throw new Error(`GraphQL Error: ${searchData.errors[0].message}`);
        }

        // Find the first matching verified collection
        const searchTerm = collectionName.toLowerCase()
            .replace(/^the\s+/i, '')
            .replace(/\s+/g, '-')
            .trim();
            
        const collection = searchData.data.aptos.collections.find(c => 
            c.verified && 
            (c.title.toLowerCase() === collectionName.toLowerCase() || 
             (c.semantic_slug && c.semantic_slug.toLowerCase() === searchTerm))
        );
        
        if (!collection) {
            return {
                status: 'not_found',
                message: `No verified collection found matching "${collectionName}". Please check the collection name and try again.`,
                search_term: collectionName
            };
        }

        // Fetch additional stats using the slug
        const statsQuery = `
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

        // Fetch collection details
        const detailsQuery = `
            query fetchCollectionWithoutNfts($slug: String) {
                aptos {
                    collections(
                        where: {
                            _or: [{ semantic_slug: { _eq: $slug } }, { slug: { _eq: $slug } }]
                        }
                    ) {
                        description
                        discord
                        twitter
                        website
                    }
                }
            }
        `;

        // Make both queries in parallel
        const [statsResponse, detailsResponse] = await Promise.all([
            fetch('https://api.indexer.xyz/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-user': process.env.INDEXER_USER_ID,
                    'x-api-key': process.env.INDEXER_API_KEY
                },
                body: JSON.stringify({
                    query: statsQuery,
                    variables: {
                        slug: collection.slug
                    }
                })
            }),
            fetch('https://api.indexer.xyz/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-user': process.env.INDEXER_USER_ID,
                    'x-api-key': process.env.INDEXER_API_KEY
                },
                body: JSON.stringify({
                    query: detailsQuery,
                    variables: {
                        slug: collection.slug
                    }
                })
            })
        ]);

        const [statsData, detailsData] = await Promise.all([
            statsResponse.json(),
            detailsResponse.json()
        ]);

        const stats = statsData.data.aptos.collection_stats;
        const details = detailsData.data.aptos.collections[0];

        // Convert values to match marketplace display
        collection.floor = collection.floor * Math.pow(10, -8);  // Convert to APT
        collection.volume = collection.volume * Math.pow(10, -8); // Convert to APT
        
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
        
        // Add formatted fields to help the AI display correctly
        collection.formatted = {
            // Basic info
            title: collection.title,
            floor_price: `${collection.floor} APT`,
            total_volume: `${collection.volume} APT`,
            usd_volume: `$${collection.usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            supply: `${collection.supply} NFTs`,
            verified: collection.verified,
            cover_url: collection.cover_url,

            // Stats
            total_sales: `${stats.total_sales} sales`,
            total_mints: `${stats.total_mints} mints`,
            total_mint_volume: `${stats.total_mint_volume * Math.pow(10, -8)} APT`,
            total_mint_usd_volume: `$${stats.total_mint_usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            
            // 24h stats
            day_stats: {
                volume: `${collection.stats.day_volume} APT`,
                sales: collection.stats.day_sales,
                usd_volume: `$${collection.stats.day_usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
            },

            // Social and external links
            social_links: {
                discord: details.discord || "Not available",
                twitter: details.twitter || "Not available",
                website: details.website || "Not available"
            },

            // Collection details
            description: details.description || "No description available",
            slug: collection.slug,
            semantic_slug: collection.semantic_slug,

            // Marketplace links
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
