import cmcClient from '../clients/coinMarketCapClient';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token_symbol } = req.body;
        const result = await cmcClient.getFullCryptoInfo(token_symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getCryptoInfoFromCMC handler:', error);
        res.status(200).json({ // Return 200 even with partial data
            error: 'Partial data available',
            data: error.partialData || null
        });
    }
}

