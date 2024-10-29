import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import systemPrompt from '../../config/systemPrompt.json';
import messageInjection from '../../config/messageInjection.json';
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

async function getCryptoInfoFromCMC(token_symbol) {
    try {
        console.log('Getting crypto info for:', token_symbol);
        const response = await fetch('http://localhost:3000/api/tools/getCryptoInfoFromCMC', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token_symbol }),
        });

        console.log('Crypto info response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to get crypto info: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Crypto info response data:', data);
        return data;
    } catch (error) {
        console.error('Error in getCryptoInfoFromCMC:', error);
        throw error;
    }
}

async function queryArxiv(search_query, max_results = 10) {
    try {
        console.log('Querying arXiv with:', { search_query, max_results });
        const response = await fetch('http://localhost:3000/api/tools/searchArxiv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search_query, max_results }),
        });

        console.log('arXiv query response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to query arXiv: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('arXiv query response data:', data);
        return data;
    } catch (error) {
        console.error('Error in queryArxiv:', error);
        throw error;
    }
}

// Add this function with the other tool functions
async function getTrendingCryptos(option) {
    try {
        console.log('Getting trending cryptos with option:', option);
        const response = await fetch('http://localhost:3000/api/tools/getTrendingCryptos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ option }),
        });

        console.log('Trending cryptos response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to get trending cryptos: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Trending cryptos response data:', data);
        return data;
    } catch (error) {
        console.error('Error in getTrendingCryptos:', error);
        throw error;
    }
}

// Add this function with the other tool functions at the top
async function searchNftCollection(collection_name) {
    try {
        console.log('Searching NFT collection:', collection_name);
        const response = await fetch('http://localhost:3000/api/tools/searchNftCollection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ collection_name }),
        });

        console.log('NFT collection search response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to search NFT collection: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('NFT collection search response data:', data);
        return data;
    } catch (error) {
        console.error('Error in searchNftCollection:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, model, temperature = 0.2 } = req.body;

        // Add near the start of the handler function
        console.log('Received messages:', JSON.stringify(messages, null, 2));

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const formattedMessages = messages.map(msg => {
            // Handle messages with uploaded images
            if (msg.role === 'user' && msg.image) {
                return {
                    role: 'user',
                    content: [
                        { 
                            type: 'text', 
                            text: msg.content || "Here's an image." 
                        },
                        { 
                            type: 'image_url', 
                            image_url: { 
                                url: msg.image,
                                detail: "auto"  // Add detail level for image analysis
                            } 
                        }
                    ]
                };
            }
            // Handle regular text messages
            return {
                role: msg.role || 'user',
                content: msg.content || ''
            };
        });

        const messagesWithSystemPrompt = [
            systemPrompt,
            ...messageInjection,
            ...formattedMessages
        ];

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
                    // Add before processing tool calls
                    if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                        console.log('Current tool calls before processing:', JSON.stringify(currentToolCalls, null, 2));
                        
                        for (const toolCall of currentToolCalls) {
                            console.log('Processing tool call:', {
                                name: toolCall.function.name,
                                arguments: toolCall.function.arguments
                            });
                            
                            if (toolCall.function.name === 'generateImage') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Generating image with args:', args);
                                    const imageUrl = await generateImage(args.prompt, args.size, args.style);
                                    console.log('Generated image URL:', imageUrl);
                                    toolCall.result = { image_url: imageUrl };
                                    assistantMessage.images.push(imageUrl);
                                } catch (error) {
                                    console.error('Error generating image:', error);
                                    // Add error handling response
                                    assistantMessage.content += "\nI apologize, but I encountered an error while trying to generate the image. " + error.message;
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
                            } else if (toolCall.function.name === 'getStockInfo') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Getting stock info with args:', args);
                                    const stockInfo = await getStockInfo(args.tickers, args.info_types);
                                    console.log('Stock info result:', stockInfo);
                                    toolCall.result = stockInfo;
                                } catch (error) {
                                    console.error('Error getting stock info:', error);
                                    toolCall.result = { error: error.message };
                                }
                            } else if (toolCall.function.name === 'getCryptoInfoFromCMC') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Getting crypto info with args:', args);
                                    const cryptoInfo = await getCryptoInfoFromCMC(args.token_symbol);
                                    console.log('Crypto info result:', cryptoInfo);
                                    toolCall.result = cryptoInfo;
                                } catch (error) {
                                    console.error('Error getting crypto info:', error);
                                    toolCall.result = { error: error.message };
                                }
                            } else if (toolCall.function.name === 'queryArxiv') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Querying arXiv with args:', args);
                                    const arxivResult = await queryArxiv(args.search_query, args.max_results);
                                    console.log('arXiv query result:', arxivResult);
                                    toolCall.result = arxivResult;
                                } catch (error) {
                                    console.error('Error querying arXiv:', error);
                                    toolCall.result = { error: error.message };
                                }
                            } else if (toolCall.function.name === 'getTrendingCryptos') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Getting trending cryptos with args:', args);
                                    const trendingCryptos = await getTrendingCryptos(args.option);
                                    console.log('Trending cryptos result:', trendingCryptos);
                                    toolCall.result = trendingCryptos;
                                } catch (error) {
                                    console.error('Error getting trending cryptos:', error);
                                    toolCall.result = { error: error.message };
                                }
                            } else if (toolCall.function.name === 'searchNftCollection') {
                                try {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log('Searching NFT collection with args:', args);
                                    const nftCollection = await searchNftCollection(args.collection_name);
                                    console.log('NFT collection search result:', nftCollection);
                                    toolCall.result = nftCollection;
                                } catch (error) {
                                    console.error('Error searching NFT collection:', error);
                                    toolCall.result = { error: error.message };
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
        const responseText = await response.text();
        console.log('Image generation response:', responseText);
        
        if (!response.ok) {
            if (response.status === 400 && responseText.includes('content policy violation')) {
                throw new Error('Content policy violation');
            }
            throw new Error(`Failed to generate image: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
        }

        const data = JSON.parse(responseText);

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

async function getStockInfo(tickers, info_types) {
    try {
        console.log('Getting stock info:', { tickers, info_types });
        const response = await fetch('http://localhost:3000/api/tools/getStockInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tickers, info_types }),
        });

        console.log('Stock info response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to get stock info: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Stock info response data:', data);
        return data;
    } catch (error) {
        console.error('Error in getStockInfo:', error);
        throw error;
    }
}
