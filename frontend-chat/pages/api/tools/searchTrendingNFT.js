async function searchTrendingNFT({ period = 'days_1', trending_by = 'crypto_volume', limit = 10 }) {
    try {
        // Validate limit parameter
        const allowedLimits = [5, 10, 20, 40];
        if (!allowedLimits.includes(limit)) {
            return {
                status: 'error',
                message: 'Invalid limit parameter. Allowed values are: 5, 10, 20, 40'
            };
        }

        const trendingQuery = `
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

        const response = await fetch('https://api.indexer.xyz/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-user': process.env.INDEXER_USER_ID,
                'x-api-key': process.env.INDEXER_API_KEY
            },
            body: JSON.stringify({
                query: trendingQuery,
                variables: {
                    period,
                    trending_by,
                    limit,
                    offset: 0
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        const trendingCollections = data.data.aptos.collections_trending.map(item => {
            const collection = item.collection;
            const floor = collection.floor * Math.pow(10, -8);  // Convert to APT
            
            return {
                title: collection.title,
                floor_price: `${floor} APT`
            };
        });

        return {
            status: 'success',
            period,
            trending_by,
            limit,
            data: trendingCollections
        };

    } catch (error) {
        console.error('Failed to fetch trending NFT collections:', error);
        return {
            status: 'error',
            message: 'Failed to fetch trending NFT collections. Please try again later.',
            error: error.message
        };
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { period, trending_by, limit } = req.body;
        
        // Convert limit to number if it's a string
        const parsedLimit = limit ? parseInt(limit, 10) : 10;

        try {
            const result = await searchTrendingNFT({ 
                period: period || 'days_1',
                trending_by: trending_by || 'crypto_volume',
                limit: parsedLimit
            });
            
            // If there's an error in the result, send it with 400 status
            if (result.status === 'error') {
                return res.status(400).json(result);
            }
            
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
