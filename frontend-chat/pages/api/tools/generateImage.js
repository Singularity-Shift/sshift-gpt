import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function uploadImageToBucket(imageUrl) {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    
    const formData = new FormData();
    formData.append('file', buffer, {
        filename: 'generated-image.png',
        contentType: 'image/png',
    });

    const uploadResponse = await fetch('http://localhost:3000/api/bucket', {
        method: 'POST',
        body: formData,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.url;
}

async function generateImage(prompt, size, style) {
    try {
        console.log('Calling OpenAI API with params:', { prompt, size, style });
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1, // Hardcoded to 1 image only
            size: size,
            style: style,
            response_format: 'url',
        });

        console.log('OpenAI API response:', JSON.stringify(response, null, 2));

        if (!response.data || response.data.length === 0) {
            throw new Error('No image generated');
        }

        const imageUrl = response.data[0].url;
        console.log('Image generated successfully:', imageUrl);
        
        const bucketUrl = await uploadImageToBucket(imageUrl);
        console.log('Image uploaded to bucket:', bucketUrl);
        
        return bucketUrl;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { prompt, size, style } = req.body;

        console.log('Received image generation request:', { prompt, size, style });

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).json({ error: 'Invalid prompt format' });
        }

        try {
            const imageUrl = await generateImage(prompt, size, style);
            res.status(200).json({ url: imageUrl });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Internal Server Error', 
                details: error.message 
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
