import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import systemPrompt from '../../config/systemPrompt.json';
import toolSchema from './tool_schemas/tool_schema.json';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let shouldStopStream = false; // Move this outside the handler to persist across requests

async function wikiSearch(action, searchString) {
    try {
        console.log('Searching Wikipedia with query:', searchString);
        const response = await fetch('http://localhost:3000/api/tools/wikiSearch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, searchString }),
        });

        console.log('Wikipedia search response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to search Wikipedia: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Wikipedia search response data:', data);

        if (!data.result) {
            throw new Error(`No search result returned from the API. Response: ${JSON.stringify(data)}`);
        }
        return data.result;
    } catch (error) {
        console.error('Error in wikiSearch:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, model, temperature = 0.2 } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const formattedMessages = messages.map(msg => {
            if (msg.role === 'user' && msg.image) {
                return {
                    role: 'user',
                    content: [
                        { type: 'text', text: msg.content || "I've uploaded an image." },
                        { type: 'image_url', image_url: { url: msg.image } }
                    ]
                };
            }
            return {
                role: msg.role || 'user',
                content: msg.content || ''
            };
        });

        const messagesWithSystemPrompt = [systemPrompt, ...formattedMessages];

        try {
            console.log('Sending request to OpenAI API...');
            const stream = await openai.chat.completions.create({
                model: model || 'gpt-4o-mini',
                messages: messagesWithSystemPrompt,
                max_tokens: 4000,
                temperature: temperature,
                stream: true,
                tools: toolSchema,
                tool_choice: "auto",
                parallel_tool_calls: true,
            });

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });

            let currentToolCalls = [];
            let assistantMessage = { 
                content: '',
                images: []
            };

            for await (const chunk of stream) {
                if (shouldStopStream) {
                    console.log('Stream stopping...');
                    res.write('data: [DONE]\n\n');
                    res.end();
                    shouldStopStream = false; // Reset the flag
                    return;
                }

                console.log('Received chunk:', JSON.stringify(chunk));

                if (chunk.choices[0]?.delta?.tool_calls) {
                    const toolCall = chunk.choices[0].delta.tool_calls[0];
                    if (!currentToolCalls.find(call => call.index === toolCall.index)) {
                        currentToolCalls.push({ index: toolCall.index, id: toolCall.id, function: { name: '', arguments: '' } });
                    }
                    const currentCall = currentToolCalls.find(call => call.index === toolCall.index);
                    if (toolCall.function) {
                        if (toolCall.function.name) {
                            currentCall.function.name = toolCall.function.name;
                        }
                        if (toolCall.function.arguments) {
                            currentCall.function.arguments += toolCall.function.arguments;
                        }
                    }
                    res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
                } else if (chunk.choices[0]?.delta?.content) {
                    assistantMessage.content += chunk.choices[0].delta.content;
                    res.write(`data: ${JSON.stringify({ 
                        content: chunk.choices[0].delta.content 
                    })}\n\n`);
                } else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                    for (const toolCall of currentToolCalls) {
                        console.log('Processing tool call:', toolCall);
                        
                        if (toolCall.function.name === 'generateImage') {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                const imageUrl = await generateImage(args.prompt, args.size, args.style);
                                toolCall.result = { image_url: imageUrl };
                                assistantMessage.images.push(imageUrl);
                            } catch (error) {
                                console.error('Error generating image:', error);
                            }
                        } else if (toolCall.function.name === 'searchWeb') {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                console.log('Searching web with query:', args.query);
                                const searchResult = await searchWeb(args.query);
                                console.log('Web search result:', searchResult);
                                toolCall.result = searchResult;
                            } catch (error) {
                                console.error('Error searching web:', error);
                            }
                        } else if (toolCall.function.name === 'wikiSearch') {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                console.log('Searching Wikipedia with query:', args.searchString);
                                const wikiResult = await wikiSearch(args.action, args.searchString);
                                console.log('Wikipedia search result:', wikiResult);
                                toolCall.result = wikiResult;
                            } catch (error) {
                                console.error('Error searching Wikipedia:', error);
                            }
                        }
                    }

                    try {
                        const continuationMessages = [
                            ...messagesWithSystemPrompt,
                            { 
                                role: 'assistant', 
                                content: assistantMessage.content,
                                tool_calls: currentToolCalls.map(call => ({
                                    id: call.id,
                                    type: 'function',
                                    function: {
                                        name: call.function.name,
                                        arguments: call.function.arguments
                                    }
                                }))
                            }
                        ];

                        for (const toolCall of currentToolCalls) {
                            if (toolCall.result) {
                                continuationMessages.push({
                                    role: 'tool',
                                    content: JSON.stringify(toolCall.result),
                                    tool_call_id: toolCall.id
                                });
                            }
                        }

                        const continuationResponse = await openai.chat.completions.create({
                            model: model || 'gpt-4o-mini',
                            messages: continuationMessages,
                            max_tokens: 1000,
                            temperature: temperature,
                            stream: true,
                        });

                        for await (const continuationChunk of continuationResponse) {
                            if (continuationChunk.choices[0]?.delta?.content) {
                                assistantMessage.content += continuationChunk.choices[0].delta.content;
                                res.write(`data: ${JSON.stringify({ 
                                    content: continuationChunk.choices[0].delta.content 
                                })}\n\n`);
                            }
                            res.flush();
                        }
                    } catch (error) {
                        console.error('Error in continuation response:', error);
                    }

                    currentToolCalls = [];
                }

                res.flush();
            }

            console.log('Sending final message:', assistantMessage);
            res.write(`data: ${JSON.stringify({ 
                final_message: {
                    content: assistantMessage.content,
                    images: assistantMessage.images
                }
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else if (req.method === 'DELETE') {
        shouldStopStream = true;
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
            if (response.status === 400 && responseText.includes('content policy violation')) {
                throw new Error('content policy violation');
            }
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

async function searchWeb(query) {
    try {
        console.log('Searching web with query:', query);
        const response = await fetch('http://localhost:3000/api/tools/searchWeb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        console.log('Web search response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to search web: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Web search response data:', data);

        if (!data.result) {
            throw new Error(`No search result returned from the API. Response: ${JSON.stringify(data)}`);
        }
        return data.result;
    } catch (error) {
        console.error('Error in searchWeb:', error);
        throw error;
    }
}
