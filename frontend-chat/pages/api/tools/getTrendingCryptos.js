async function getTrendingCryptos(option, limit = 10) {
    try {
        limit = Math.min(Math.max(1, limit), 250);

        let url;

        switch (option) {
            case 'popularity':
                url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=gecko_desc&per_page=${limit}&page=1`;
                break;
            case 'top_gainers':
                url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=${limit}&page=1`;
                break;
            case 'market_cap':
                url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`;
                break;
            default:
                throw new Error('Invalid option provided. Please use "popularity", "top_gainers", or "market_cap".');
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        const trendingList = [];

        if (option === 'popularity') {
            for (const coin of data) {
                const coinInfo = {
                    name: coin.name,
                    symbol: coin.symbol,
                    market_cap_rank: coin.market_cap_rank,
                };
                trendingList.push(coinInfo);
            }
        } else {
            for (const coin of data) {
                const coinInfo = {
                    name: coin.name,
                    symbol: coin.symbol,
                    market_cap_rank: coin.market_cap_rank,
                    ...(option === 'top_gainers' && { price_change_percentage_24h: coin.price_change_percentage_24h })
                };
                trendingList.push(coinInfo);
            }
        }

        return trendingList;
    } catch (error) {
        console.error('Failed to fetch trending cryptos:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { option, limit } = req.body;

        if (!option) {
            return res.status(400).json({ error: 'option is required' });
        }

        try {
            const result = await getTrendingCryptos(option, limit);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

