import backend from '../../../../src/services/backend';

export async function generateImage(prompt, size, style, auth, signal) {
    try {
        console.log('Generating image with params:', { prompt, size, style });
        
        const result = await backend.post('/tools/generate-image', {
            prompt,
            size,
            style,
        }, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            timeout: 60000,
            signal,
        });

        if (!result.data.url) {
            throw new Error('No image URL returned from generation');
        }

        return {
            url: result.data.url,
            prompt: result.prompt || prompt
        };
    } catch (error) {
        console.error('Error in generateImage:', error);
        return {
            error: true,
            message: `Failed to generate image: ${error.message}`
        };
    }
}

export async function searchWeb(query, auth, signal) {
    try {
        const response = await backend.get('/tools/search-web', {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`  },
            params: { query },
            timeout: 60000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in searchWeb:', error);
        return {
            error: true,
            message: `Failed to search web: ${error.message}`
        };
    }
}

export async function wikiSearch(action, searchString, auth, signal) {
    try {
        const response = await backend.get('/tools/wiki-search', {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`  },
            params: { action, searchString },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in wikiSearch:', error);
        return {
            error: true,
            message: `Failed to search Wikipedia: ${error.message}`
        };
    }
}

export async function getStockInfo(tickers, info_types, auth, signal) {
    try {
        const result = await backend.post('/tools/get-stock-info', {
             tickers, info_types },
            {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}` 
                },
                timeout: 30000,
                signal
            }
        );

        return result.data;
    } catch (error) {
        console.error('Error in getStockInfo:', error);
        return {
            error: true,
            message: `Failed to get stock info: ${error.message}`
        };
    }
}

export async function getCryptoInfoFromCMC(token_symbol, auth, signal) {
    try {
        const result = await backend.get(`/tools/get-crypto-info-from-cmd/${token_symbol}`, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            timeout: 30000,
            signal
        });
        
        return result.data;
    } catch (error) {
        return {
            error: true,
            message: `Failed to get crypto info from CoinMarketCap: ${error.message}`
        };
    }
}

export async function queryArxiv(search_query, max_results, sort_by, sort_order, auth, signal) {
    try {
        const response = await backend.post('/tools/search-arxiv',
        { search_query, max_results, sort_by, sort_order },
        {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`  },
            timeout: 30000,
            signal
        });
        
        return response.data;
    } catch (error) {
        console.error('Error in queryArxiv:', error);
        return {
            error: true,
            message: `Failed to query arXiv: ${error.message}`
        };
    }
}

export async function getTrendingCryptos(option, limit = 10, auth, signal) {
    try {
        const response = await backend.get(`/tools/get-trending-cryptos/${option}`, {
            params: { limit },
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in getTrendingCryptos:', error);
        return {
            error: true,
            message: `Failed to get trending cryptos: ${error.message}`
        };
    }
}

export async function searchNftCollection(collection_name, auth, signal) {
    try {
        const response = await backend.get(`/tools/search-nft-collection/${collection_name}`, {
            headers: {
                Authorization: `Bearer ${auth}`,
                'Content-Type': 'application/json' 
            },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in searchNftCollection:', error);
        return {
            error: true,
            message: `Failed to search NFT collection: ${error.message}`
        };
    }
}

export async function searchTrendingNFT(period, trending_by, limit, auth, signal) {
    try {
        const response = await backend.get('/tools/search-trending-nft', {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            params: { period, trending_by, limit },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in searchTrendingNFT:', error);
        return {
            error: true,
            message: `Failed to search trending NFTs: ${error.message}`
        };
    }
}

export async function createSoundEffect(text, duration_seconds, prompt_influence, auth, signal) {
    try {
        console.log('Creating sound effect with params:', { text, duration_seconds, prompt_influence });
        
        const result = await backend.post('/tools/create-sound-effect', {
            text, duration_seconds, prompt_influence 
        },
        {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`},
            timeout: 60000,
            signal
        });

        if (!result.data.url) {
            throw new Error('No sound effect URL returned from generation');
        }

        return {
            content: `[Sound Effect: ${text}](${result.data.url})`,
            duration_seconds,
            text
        };
    } catch (error) {
        console.error('Error in createSoundEffect:', error);
        return {
            error: true,
            message: `Failed to create sound effect: ${error.message}`
        };
    }
}

export async function fetchUserNFTCollections(auth, signal) {
    try {
        const response = await backend.post('/tools/fetch-user-nft-collections', {}, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in fetchUserNFTCollections:', error);
        return {
            error: true,
            message: `Failed to fetch user NFT collections: ${error.message}`
        };
    }
}

export async function getAllTopics(auth, signal) {
    try {
        const response = await backend.get('/handle-finder/topics', {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in getAllTopics:', error);
        return {
            error: true,
            message: 'Failed to fetch all topics'
        };
    }
}

export async function getTokensMentioned(limit, page, auth, signal) {
    try {
        const response = await backend.get('/handle-finder/tokens/mentions', {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            params: { limit, page },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in getTokensMentioned:', error);
        return {
            error: true,
            message: 'Failed to fetch tokens mentioned'
        };
    }
}

export async function findCategoryCounts(date, auth, signal) {
    try {
        const response = await backend.get('/handle-finder/categories', {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            params: { date },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in findCategoryTopicCounts:', error);
        return {
            error: true,
            message: 'Failed to fetch category topic counts'
        };
    }
}

export async function getPublicationsByCategory(category, date, limit, page, auth, signal) {
    try {
        const response = await backend.get('/handle-finder/categories/publications', {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            params: { category, date, limit, page },
            timeout: 30000,
            signal
        });

        return response.data;
    } catch (error) {
        console.error('Error in getPublicationsByCategory:', error);
        return {
            error: true,
            message: 'Failed to fetch publications by category'
        };
    }
}