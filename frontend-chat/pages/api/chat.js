import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import systemPrompt from '../../config/systemPrompt.json';
import toolSchema from './tool_schemas/tool_schema.json';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
                tools: [toolSchema],
                tool_choice: "auto",
            });

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });

            let currentToolCall = null;
            let assistantMessage = { content: '', image: null };

            for await (const chunk of stream) {
                if (shouldStopStream) {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    break;
                }

                if (chunk.choices[0]?.delta?.tool_calls) {
                    const toolCall = chunk.choices[0].delta.tool_calls[0];
                    if (!currentToolCall) {
                        currentToolCall = { function: { name: '', arguments: '' } };
                        res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
                    }
                    if (toolCall.function) {
                        if (toolCall.function.name) {
                            currentToolCall.function.name = toolCall.function.name;
                        }
                        if (toolCall.function.arguments) {
                            currentToolCall.function.arguments += toolCall.function.arguments;
                        }
                    }
                } else if (chunk.choices[0]?.delta?.content) {
                    assistantMessage.content += chunk.choices[0].delta.content;
                    res.write(`data: ${JSON.stringify({ content: chunk.choices[0].delta.content })}\n\n`);
                } else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                    if (currentToolCall && currentToolCall.function.name === 'generateImage') {
                        try {
                            const args = JSON.parse(currentToolCall.function.arguments);
                            const imageUrl = await generateImage(args.prompt, args.size, args.style);
                            assistantMessage.image = imageUrl;
                            res.write(`data: ${JSON.stringify({ tool_response: { name: 'generateImage', result: { image_url: imageUrl } } })}\n\n`);
                        } catch (error) {
                            console.error('Error generating image:', error);
                            res.write(`data: ${JSON.stringify({ tool_response: { name: 'generateImage', error: 'Failed to generate image' } })}\n\n`);
                        }
                    }
                    currentToolCall = null;
                }

                // Flush the response to ensure the client receives the data immediately
                res.flush();
            }

            // Send the final message with both content and image
            res.write(`data: ${JSON.stringify({ final_message: assistantMessage })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('OpenAI API Error:', error);
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

async function generateImage(prompt, size, style) {
    try {
        console.log('Generating image with params:', { prompt, size, style });
        const response = await fetch('http://localhost:3000/api/tools/generateImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, size, style }),
        });

        console.log('Image generation response status:', response.status);
        
        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
        }

        const data = await response.json();

        if (!data.url) {
            throw new Error(`No image URL returned from the API. Response: ${JSON.stringify(data)}`);
        }
        return data.url;
    } catch (error) {
        console.error('Error in generateImage:', error);
        throw error;
    }
}
