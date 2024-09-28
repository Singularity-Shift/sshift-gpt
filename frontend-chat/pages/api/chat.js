import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import systemPrompt from '../../config/systemPrompt.json';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Variable to track if the stream should be stopped
let shouldStopStream = false;

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, model, temperature = 0.2 } = req.body;

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
                temperature: temperature,
                stream: true,
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            for await (const chunk of stream) {
                if (shouldStopStream) {
                    res.write('data: [STOPPED]\n\n');
                    res.end();
                    break; // Exit the loop if the stream should be stopped
                }
                const payload = JSON.stringify(chunk.choices[0]?.delta || {});
                res.write(`data: ${payload}\n\n`);
                res.flush();
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('OpenAI API Error:', error.response ? error.response.data : error.message);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else if (req.method === 'DELETE') {
        // Handle stop request
        shouldStopStream = true; // Set the flag to stop the stream
        res.status(200).json({ message: 'Stream stopping initiated' });
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}