import fetch from 'node-fetch';
import xml2js from 'xml2js';

async function queryArxiv(searchQuery, maxResults = 10, sortBy = 'submittedDate', sortOrder = 'descending') {
    const baseUrl = "http://export.arxiv.org/api/query";
    
    // Ensure all required parameters have values
    const params = new URLSearchParams({
        search_query: searchQuery,
        start: 0,
        max_results: maxResults || 10,
        sortBy: sortBy || 'submittedDate',
        sortOrder: sortOrder || 'descending'
    });

    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (response.ok) {
            const responseText = await response.text();
            const responseDict = await xml2js.parseStringPromise(responseText);
            
            if (responseDict.feed && responseDict.feed.entry) {
                responseDict.feed.entry = responseDict.feed.entry.map(entry => {
                    // Format the date
                    if (entry.published && entry.published[0]) {
                        const publishDate = new Date(entry.published[0]);
                        entry.publishedFormatted = publishDate.toLocaleDateString();
                    }

                    // Format the links as markdown
                    if (entry.link) {
                        entry.link = entry.link.map(link => {
                            // Convert link object to markdown format based on type
                            if (link.$.title === 'pdf') {
                                return `[PDF](${link.$.href})`;
                            } else if (link.$.rel === 'alternate') {
                                return `[Abstract](${link.$.href})`;
                            }
                            return link;
                        });
                    }

                    return entry;
                });
            }
            
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
        const { 
            search_query, 
            max_results = 10, 
            sort_by = 'submittedDate', 
            sort_order = 'descending'
        } = req.body;

        if (!search_query) {
            return res.status(400).json({ error: 'search_query is required' });
        }

        try {
            const result = await queryArxiv(search_query, max_results, sort_by, sort_order);
            res.status(200).json(JSON.parse(result));
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
