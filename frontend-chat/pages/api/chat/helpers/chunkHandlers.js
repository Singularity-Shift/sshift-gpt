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

export async function processToolCalls(currentToolCalls) {
    const results = [];
    
    for (const toolCall of currentToolCalls) {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const toolFunction = toolCalls[toolCall.function.name];
            
            if (typeof toolFunction === 'function') {
                const result = await toolFunction(...Object.values(args));
                
                if (result.error) {
                    results.push({
                        role: 'tool',
                        content: JSON.stringify({
                            error: true,
                            message: result.message || 'Tool call failed'
                        }),
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
    
    return results;
} 