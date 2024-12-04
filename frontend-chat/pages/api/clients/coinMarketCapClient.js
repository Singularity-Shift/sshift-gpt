import dotenv from 'dotenv';

dotenv.config();

class CoinMarketCapClient {
    constructor(apiKey = process.env.CMC_API_KEY) {
        if (!apiKey) {
            throw new Error('CMC_API_KEY is not configured in environment variables');
        }
        
        this.apiKey = apiKey;
        this.baseUrl = 'https://pro-api.coinmarketcap.com/v1';
        this.headers = {
            'Accepts': 'application/json',
            'X-CMC_PRO_API_KEY': this.apiKey
        };
    }

    async fetchFromCMC(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}${endpoint}?${queryString}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching from CMC (${endpoint}):`, error);
            return null;
        }
    }

    async getBasicInfo(symbol) {
        const data = await this.fetchFromCMC('/cryptocurrency/quotes/latest', {
            symbol: symbol,
            convert: 'USD'
        });
        return data?.data?.[symbol.toUpperCase()] || null;
    }

    async getMetadata(symbol) {
        const data = await this.fetchFromCMC('/cryptocurrency/info', {
            symbol: symbol
        });
        return data?.data?.[symbol.toUpperCase()] || null;
    }

    async getMarketPairs(symbol) {
        const data = await this.fetchFromCMC('/cryptocurrency/market-pairs/latest', {
            symbol: symbol
        });
        return data?.data?.market_pairs || null;
    }

    async getFullCryptoInfo(symbol) {
        const [basicInfo, metadata] = await Promise.all([
            this.getBasicInfo(symbol),
            this.getMetadata(symbol)
        ]);

        if (!basicInfo) {
            return {
                error: true,
                message: `Could not find valid cryptocurrency data for symbol '${symbol}'`
            };
        }

        const quote = basicInfo.quote?.USD || {};
        const currentPrice = quote.price;
        const totalSupply = basicInfo.total_supply;
        const undilutedMarketCap = currentPrice && totalSupply ? currentPrice * totalSupply : null;

        const result = {
            market_cap: quote.market_cap,
            current_price: currentPrice,
            total_volume: quote.volume_24h,
            circulating_supply: basicInfo.circulating_supply,
            total_supply: totalSupply,
            undiluted_market_cap: undilutedMarketCap,
            description: metadata?.description,
            logo: metadata?.logo,
            urls: metadata?.urls || {}
        };

        // Try to get market pairs but don't fail if unavailable
        try {
            const marketPairs = await this.getMarketPairs(symbol);
            if (marketPairs) {
                result.exchanges = marketPairs.map(pair => pair.exchange.name);
            }
        } catch (error) {
            console.error('Error getting market pairs:', error);
            result.exchanges = []; // Empty array if market pairs unavailable
        }

        return result;
    }
}

// Export a singleton instance
const cmcClient = new CoinMarketCapClient();
export default cmcClient; 