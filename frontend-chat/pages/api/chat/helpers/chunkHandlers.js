import backend from '../../../../src/services/backend';
import * as toolCalls from './toolCalls.js';

export async function handleToolCall(chunk, currentToolCalls) {
    if (chunk.choices[0]?.delta?.tool_calls) {
        const toolCall = chunk.choices[0].delta.tool_calls[0];
        
        if (!currentToolCalls.find(call => call.index === toolCall.index)) {
            currentToolCalls.push({ 
                index: toolCall.index, 
                id: toolCall.id, 
                function: { name: '', arguments: '' } 
            });
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
        
        return true;
    }
    return false;
}

export function writeResponseChunk(chunk, res) {
    if (chunk.choices[0]?.delta?.content) {
        res.write(`data: ${JSON.stringify({ 
            content: chunk.choices[0].delta.content 
        })}\n\n`);
    }
}

export async function processToolCalls(currentToolCalls, userConfig, auth) {
    const results = [];
    
    // Set global userConfig for tool calls
    global.userConfig = userConfig;
    
    for (const toolCall of currentToolCalls) {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const toolFunction = toolCalls[toolCall.function.name];
            
            if (typeof toolFunction === 'function') {
                console.log(`Processing tool call: ${toolCall.function.name}`, args);
                await checkToolsCredits(userConfig, toolCall.function.name, auth)
                const result = await toolFunction(...Object.values(args));
                
                if (result.error) {
                    console.error(`Tool call error for ${toolCall.function.name}:`, result.error);
                    results.push({
                        role: 'tool',
                        content: JSON.stringify({
                            error: true,
                            message: result.message || 'Tool call failed'
                        }),
                        tool_call_id: toolCall.id
                    });
                } else {
                    console.log(`Tool call success for ${toolCall.function.name}:`, result);
                    
                    // Special handling for image generation results
                    if (toolCall.function.name === 'generateImage') {
                        // Format the result to include both URL and prompt
                        const formattedResult = {
                            url: result.url,
                            prompt: result.prompt,
                            formatted_url: `![Generated Image](${result.url})`
                        };
                        results.push({
                            role: 'tool',
                            content: JSON.stringify(formattedResult),
                            tool_call_id: toolCall.id
                        });
                    } else {
                        results.push({
                            role: 'tool',
                            content: JSON.stringify(result),
                            tool_call_id: toolCall.id
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing tool call ${toolCall.function.name}:`, error);
            results.push({
                role: 'tool',
                content: JSON.stringify({
                    error: true,
                    message: `Tool call failed: ${error.message}`
                }),
                tool_call_id: toolCall.id
            });
        }
    }
    
    // Clear global userConfig after tool calls are done
    global.userConfig = undefined;
    
    return results;
}

const checkToolsCredits = async (userConfig, tool, auth) => {
    const adminConfig = await backend.get('/admin-config');

    const toolsCredits = userConfig.toolsActivity.find(u => u.name === tool);
    
    const toolsConfig = adminConfig.data.tools.find(m => m.name === tool);

    if(!toolsConfig) {
        return;
    }

    if(toolsCredits?.creditsUsed && toolsCredits.creditsUsed >= toolsConfig.credits * userConfig.duration) {
        throw new Error(`Not enough credits for tool: ${tool}`);
    }

    await backend.put('/user', {
        name: tool,
        creditType: 'Tools',
        creditsUsed: toolsCredits?.creditsUsed || 0,
    }, { headers: { Authorization: `Bearer ${auth}` } });
}