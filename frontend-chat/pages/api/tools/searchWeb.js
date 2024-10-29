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
                { role: "system", content: "Be verbose,precise and and accurate as possible, maximising the amount of information you can provided by giving a detailed and in depth summary of each result or topic." },
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
        
        if (!response.ok) {
            // Handle different error status codes
            switch (response.status) {
                case 524:
                    return {
                        error: true,
                        message: "I apologize, but I'm having trouble accessing the latest information right now due to a timeout. This usually means the search service is temporarily overloaded. Please try your question again in a moment."
                    };
                case 429:
                    return {
                        error: true,
                        message: "I apologize, but I've hit the rate limit for web searches. Please try again in a few minutes when the limit resets."
                    };
                case 401:
                    return {
                        error: true,
                        message: "I apologize, but I'm having authentication issues with the search service. This is a technical problem on our end that needs to be fixed."
                    };
                default:
                    return {
                        error: true,
                        message: `I apologize, but I encountered an error (${response.status}) while trying to search for information. Please try again in a moment.`
                    };
            }
        }

        const data = await response.json();
        console.log('Perplexity API response data:', JSON.stringify(data, null, 2));

        return {
            error: false,
            result: data.choices[0].message.content
        };

    } catch (error) {
        console.error('Error in searchWeb:', error);
        // Handle parsing errors or network errors
        return {
            error: true,
            message: "I apologize, but I encountered an unexpected error while trying to search for information. This might be due to temporary network issues or service disruption. Please try your question again in a moment."
        };
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { query } = req.body;

        if (typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ 
                error: true,
                message: "I apologize, but I need a valid search query to look up information. Could you please rephrase your question?" 
            });
        }

        try {
            const result = await searchWeb(query);
            if (result.error) {
                // Return a 200 status with the error message so it can be displayed to the user
                res.status(200).json(result);
            } else {
                res.status(200).json({ result: result.result });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(200).json({ 
                error: true,
                message: "I apologize, but something went wrong while searching for information. This is likely a temporary issue. Please try your question again in a moment."
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ 
            error: true,
            message: "I apologize, but I can only process POST requests for web searches. This is a technical limitation."
        });
    }
}
