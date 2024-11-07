import dotenv from 'dotenv';

// Force dotenv to load environment variables
dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Add debug logging
    console.log('CMC_API_KEY exists:', !!process.env.CMC_API_KEY);
    console.log('CMC_API_KEY length:', process.env.CMC_API_KEY?.length);

    try {
        const { token_symbol } = req.body;
        const result = await getCryptoInfoFromCMC(token_symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getCryptoInfoFromCMC handler:', error);
        res.status(500).json({ error: error.message });
    }
}
async function getCryptoInfoFromCMC(token_symbol) {
    if (!process.env.CMC_API_KEY) {
        throw new Error('CMC_API_KEY is not configured in environment variables');
    }

    const headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    };

    async function getBasicInfo(symbol) {
        const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
        try {
            const response = await fetch(`${url}?symbol=${symbol}&convert=USD`, { 
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data?.data?.[symbol.toUpperCase()] || null;
        } catch (error) {
            console.error('Error fetching basic info:', error);
            return null;
        }
    }

    async function getMetadata(symbol) {
        const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";
        try {
            const response = await fetch(`${url}?symbol=${symbol}`, { 
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data?.data?.[symbol.toUpperCase()] || null;
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }

    async function getMarketPairs(symbol) {
        const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest";
        try {
            const response = await fetch(`${url}?symbol=${symbol}`, { 
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data?.data?.market_pairs || null;
        } catch (error) {
            console.error('Error fetching market pairs:', error);
            return null;
        }
    }

    const basic_info = await getBasicInfo(token_symbol);
    if (!basic_info) {
        throw new Error("Failed to retrieve basic info");
    }

    const metadata = await getMetadata(token_symbol);
    const market_pairs = await getMarketPairs(token_symbol);

    const quote = basic_info.quote?.USD || {};
    const current_price = quote.price;
    const total_supply = basic_info.total_supply;
    const undiluted_market_cap = current_price && total_supply ? current_price * total_supply : null;

    return {
        market_cap: quote.market_cap,
        current_price: current_price,
        total_volume: quote.volume_24h,
        circulating_supply: basic_info.circulating_supply,
        total_supply: total_supply,
        undiluted_market_cap: undiluted_market_cap,
        description: metadata?.description,
        logo: metadata?.logo,
        urls: metadata?.urls || {},
        exchanges: market_pairs ? market_pairs.map(pair => pair.exchange.name) : []
    };
}

