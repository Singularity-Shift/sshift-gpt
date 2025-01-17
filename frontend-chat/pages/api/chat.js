import dotenv from 'dotenv';
import { streamResponse } from './chat/helpers/streamResponse.js';
import backend from '../../src/services/backend';
dotenv.config();

let shouldStopStream = false;
let controller = new AbortController();

export default async function handler(req, res) {
    if (req.method === 'POST') {
        shouldStopStream = false; // Reset the flag at the start of a new stream
        const { messages, model, temperature = 0.2 } = req.body;

        const { authorization } = req.headers;
        controller = new AbortController();


        console.log('Received messages:', JSON.stringify(messages, null, 2));

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        try {
            // Fetch user config and admin config in parallel
            const [responseUserConfig, responseAdminConfig] = await Promise.all([
                backend.get('/user', { headers: { Authorization: authorization } }),
                backend.get('/admin-config')
            ]);

            if (!responseUserConfig?.data) {
                console.error('Error fetching user config:', responseUserConfig.error);
                return res.status(responseUserConfig.status).json({ error: responseUserConfig.statusText});
            }

            const userConfig = responseUserConfig.data;
            const adminConfig = responseAdminConfig.data;

            if (!userConfig.active && !userConfig.isCollector) {
                console.log('User is not active or collector');
                return res.status(403).json({ error: 'User is not subscribed' });
            }

            if(!userConfig.isCollector) {
                await checkModelCredits(userConfig, model, authorization);
            }
            
            // Pass shouldStopStream to streamResponse
            await streamResponse(
                res, 
                model, 
                messages, 
                temperature, 
                userConfig, 
                authorization, 
                adminConfig.systemPrompt,
                () => shouldStopStream,
                controller.signal,
            );
        } catch (error) {
            console.error('Error in handler:', error.response?.data?.message || error.message);
            if (!res.writableEnded) {
                res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
            }
        }
    } else if (req.method === 'DELETE') {
        shouldStopStream = true;
        console.log('Stream stopping initiated');
        controller.abort();
        res.status(200).json({ message: 'Stream stopping initiated' });
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

const checkModelCredits = async (userConfig, model, auth) => {
    const adminConfig = await backend.get('/admin-config');

    const modelCredits = userConfig.modelsActivity.find(u => u.name === model);
    
    const modelConfig = adminConfig.data.models.find(m => m.name === model);

    if(!modelConfig) {
        return;
    }

    if(modelCredits?.creditsUsed && modelCredits.creditsUsed >= modelConfig.credits * userConfig.duration) {
        throw new Error(`Not enough credits for model: ${model}`);
    }

    await backend.put('/user', {
        name: model,
        creditType: 'Models',
        creditsUsed: modelCredits?.creditsUsed || 0,
    }, { headers: { Authorization: `Bearer ${auth}` } });
}
