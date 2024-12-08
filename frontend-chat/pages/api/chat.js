import dotenv from 'dotenv';
// import messageInjection from '../../config/messageInjection.json';
import { streamResponse } from './chat/helpers/streamResponse.js';
import backend from '../../src/services/backend';
dotenv.config();

let shouldStopStream = false;

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, auth, model, temperature = 0.2 } = req.body;

        console.log('Received messages:', JSON.stringify(messages, null, 2));

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        try {
            const responseUserConfig = await backend.get('/user', { headers: { Authorization: `Bearer ${auth}` } });

            if (!responseUserConfig?.data) {
                console.error('Error fetching user config:', responseUserConfig.error);
                return res.status(responseUserConfig.status).json({ error: responseUserConfig.statusText});
            }

            const userConfig = responseUserConfig.data;

            console.log('User config:', userConfig);

            if (!userConfig.active && !userConfig.isCollector) {
                console.log('User is not active or collector');
                return res.status(403).json({ error: 'User is not subscribed' });
            }

            if(!userConfig.isCollector) {
                await checkModelCredits(userConfig, model, auth);
            }
            
            // Start streaming the response
            await streamResponse(res, model, messages, temperature, userConfig, auth);
        } catch (error) {
            console.error('Error in handler:', JSON.stringify(error.response.data.message));
            if (!res.writableEnded) {
                res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
            }
        }
    } else if (req.method === 'DELETE') {
        shouldStopStream = true;
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