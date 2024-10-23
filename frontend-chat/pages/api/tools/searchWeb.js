import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function searchWeb(query) {
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
                { role: "system", content: "Be precise and concise." },
                { role: "user", content: query }
            ],
            max_tokens: 1000,
            temperature: 0.2,
            top_p: 0.9,
            return_citations: true,
            search_domain_filter: ["perplexity.ai"],
            return_images: false,
            return_related_questions: false,
            search_recency_filter: "month",
            top_k: 0,
            stream: false,
            presence_penalty: 0,
            frequency_penalty: 1
        })
    };

    try {
        console.log('Sending request to Perplexity API with query:', query);
        const response = await fetch('https://api.perplexity.ai/chat/completions', options);
        console.log('Perplexity API response status:', response.status);
        
        const data = await response.json();
        console.log('Perplexity API response data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            return data.choices[0].message.content;
        } else {
            throw new Error(`Perplexity API error: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error in searchWeb:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { query } = req.body;

        if (typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ error: 'Invalid query format' });
        }

        try {
            const searchResult = await searchWeb(query);
            res.status(200).json({ result: searchResult });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Internal Server Error', 
                details: error.message
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
