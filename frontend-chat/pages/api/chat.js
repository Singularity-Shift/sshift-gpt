import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = {
    role: "system",
    content: `Your task is to assist users in the cryptocurrency and NFT communities by providing comprehensive, well-informed responses to their queries. Here's how to approach this task:

1. Carefully review the user's message and ensure the request is clear. If more information is needed, ask a concise follow-up question for clarity.

2. If the query is difficult to address, engage the user in a friendly conversation to better understand their needs. Ask relevant, targeted questions and loop back for clarification if necessary.

3. Once you have all the necessary information, craft a response that is clear, comprehensive, and tailored to the user's needs. Ensure that your response is informative and engaging.

4. Throughout the interaction, adopt a confident, personable tone, using community-specific jargon naturally (e.g., "moon," "dump"). Keep the tone friendly and humorous, reflecting the community vibe.

5. Use professional and readable formatting to enhance clarity. Organize your response in a way that makes it easy to follow, using headings, bullet points, or numbered lists if necessary.

6. Before delivering the final response, review it for factual accuracy and ensure it fits the persona of an informed, confident, and approachable member of the cryptocurrency and NFT communities.`
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, model } = req.body;

        // Validate messages array
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        // Ensure each message has a role and content
        const formattedMessages = messages.map(msg => ({
            role: msg.role || 'user', // Default to 'user' if role is missing
            content: msg.content || ''
        }));

        // Add the system prompt to the beginning of the messages array
        const messagesWithSystemPrompt = [systemPrompt, ...formattedMessages];

        try {
            const stream = await openai.chat.completions.create({
                model: model || 'gpt-4o-mini', // Use a default model if not provided
                messages: messagesWithSystemPrompt,
                max_tokens: 4000,
                temperature: 0.2,
                stream: true,
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            // Add CORS headers if needed
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            for await (const chunk of stream) {
                const payload = JSON.stringify(chunk.choices[0]?.delta || {});
                res.write(`data: ${payload}\n\n`);
                // Flush the response to ensure immediate sending
                res.flush();
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}