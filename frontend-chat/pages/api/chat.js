import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        try {
            const stream = await openai.chat.completions.create({
                model: model || 'gpt-4o-mini', // Use a default model if not provided
                messages: formattedMessages,
                stream: true,
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
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