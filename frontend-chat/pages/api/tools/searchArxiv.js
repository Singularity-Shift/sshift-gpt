import fetch from 'node-fetch';
import xml2js from 'xml2js';

async function queryArxiv(searchQuery, maxResults = 10) {
    const baseUrl = "http://export.arxiv.org/api/query";
    const params = new URLSearchParams({
        search_query: searchQuery,
        start: 0,
        max_results: maxResults
    });

    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (response.ok) {
            const responseText = await response.text();
            const responseDict = await xml2js.parseStringPromise(responseText);
            return JSON.stringify(responseDict);
        } else {
            return JSON.stringify({ error: `Failed to query arXiv, received HTTP ${response.status}` });
        }
    } catch (error) {
        return JSON.stringify({ error: error.message });
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { search_query, max_results } = req.body;

        if (!search_query) {
            return res.status(400).json({ error: 'search_query is required' });
        }

        try {
            const result = await queryArxiv(search_query, max_results);
            res.status(200).json(JSON.parse(result));
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
