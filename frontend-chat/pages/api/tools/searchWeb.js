import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function searchWeb(query) {
    // Add current date information to date-sensitive queries
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Replace any year references with current year
    query = query.replace(/\b20\d{2}\b/, currentDate.getFullYear());
    
    // If query contains month references without a year, append current year
    monthNames.forEach(month => {
        const monthRegex = new RegExp(`\\b${month}\\b`, 'i');
        if (query.match(monthRegex) && !query.match(/\d{4}/)) {
            query += ` ${currentDate.getFullYear()}`;
        }
    });

    // If query is about "today's" news, add specific date
    if (query.toLowerCase().includes("today")) {
        const formattedDate = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        query = query.replace(/today/i, formattedDate);
    }

    console.log('Modified search query:', query);

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3.1-sonar-large-128k-online",
            messages: [
                { role: "system", content: "Be precise and and accurate as possible, maximising the amount of information you can provided by giving a detailed and in depth summary of each result or topic." },
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
