import dotenv from 'dotenv';
import systemPrompt from '../../config/systemPrompt.json';
// import messageInjection from '../../config/messageInjection.json';
import { streamResponse } from './chat/helpers/streamResponse.js';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { createSurfClient } from '@thalalabs/surf';
import { APTOS_NETWORK } from '../../config/env';
import * as jwt from 'jsonwebtoken';
import { SubscriptionABI } from '../../abis/SubscriptionAbi';

dotenv.config();

const aptos = new Aptos(
    new AptosConfig({
        network:
        APTOS_NETWORK === 'mainnet'
            ? Network.MAINNET
            : Network.TESTNET,
    })
);

const abi = createSurfClient(aptos)

let shouldStopStream = false;

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { messages, model, temperature = 0.2 } = req.body;

        console.log('Received messages:', JSON.stringify(messages, null, 2));

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const auth = messages[messages.length - 1].auth;

        const payload = jwt.verify(
            auth,
            process.env.JWT_SECRET_KEY,
        );

        const isSubscribedResult = await abi.useABI(SubscriptionABI).view.has_subscription_active({
            typeArguments: [],
            functionArguments: [payload.address],
        });

        const isSubscribed = isSubscribedResult?.[0];

        if (!isSubscribed) {
            return res.status(403).json({ error: 'User is not subscribed' });
        }
        
        try {
            await streamResponse(res, model, messages, temperature);
        } catch (error) {
            console.error('Error in handler:', error);
            if (!res.writableEnded) {
                res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
