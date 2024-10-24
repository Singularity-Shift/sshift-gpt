import fetch from 'node-fetch';

async function mediawikiQuery(action, searchString) {
    const url = "https://en.wikipedia.org/w/api.php";
    const params = new URLSearchParams({
        action: action,
        format: "json",
        list: "search",
        srsearch: searchString
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from Wikipedia API:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { action, searchString } = req.body;

        if (typeof action !== 'string' || typeof searchString !== 'string' || action.trim() === '' || searchString.trim() === '') {
            return res.status(400).json({ error: 'Invalid action or search string format' });
        }

        try {
            const wikiResult = await mediawikiQuery(action, searchString);
            res.status(200).json({ result: wikiResult });
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
