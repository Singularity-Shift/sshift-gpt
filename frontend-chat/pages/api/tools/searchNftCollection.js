async function searchNftCollection(collectionName) {
    try {
        const query = `
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

        const variables = {
            text: collectionName,
            offset: 0,
            limit: 1
        };

        const response = await fetch('https://api.indexer.xyz/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-user': process.env.INDEXER_USER_ID,
                'x-api-key': process.env.INDEXER_API_KEY
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        // Get the first collection from the results
        const collection = data.data.aptos.collections[0];
        
        if (collection) {
            // Convert values to match marketplace display
            collection.floor = collection.floor * Math.pow(10, -8);  // Convert to APT
            collection.volume = collection.volume * Math.pow(10, -8); // Convert to APT
            
            // Add formatted fields to help the AI display correctly
            collection.formatted = {
                floor_price: `${collection.floor} APT`,
                total_volume: `${collection.volume} APT`,
                usd_volume: `$${collection.usd_volume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (in USD)`,
                supply: `${collection.supply} NFTs`
            };
            
            return collection;
        }
        
        return null;

    } catch (error) {
        console.error('Failed to search NFT collection:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { collection_name } = req.body;

        if (!collection_name) {
            return res.status(400).json({ error: 'collection_name is required' });
        }

        try {
            const result = await searchNftCollection(collection_name);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
