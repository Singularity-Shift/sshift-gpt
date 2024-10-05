import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { prompt, size, style } = req.body;

        console.log('Received image generation request:', { prompt, size, style });

        // Define valid options
        const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
        const validStyles = ["vivid", "natural"];

        // Validate prompt
        if (typeof prompt !== 'string' || prompt.trim() === '') {
            console.error('Invalid prompt');
            return res.status(400).json({ error: 'Invalid prompt format' });
        }

        // Validate size and style, provide defaults if invalid
        const selectedSize = validSizes.includes(size) ? size : "1024x1024";
        const selectedStyle = validStyles.includes(style) ? style : "vivid";

        try {
            console.log('Calling OpenAI API with params:', { prompt, size: selectedSize, style: selectedStyle });
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: prompt,
                size: selectedSize,
                style: selectedStyle,
                response_format: 'url',
            });

            console.log('OpenAI API response:', JSON.stringify(response, null, 2));

            const imageUrl = response.data[0]?.url;
            if (imageUrl) {
                console.log('Image generated successfully:', imageUrl);
                res.status(200).json({ url: imageUrl });
            } else {
                console.error('No image URL in OpenAI response');
                res.status(500).json({ error: 'Failed to generate image: No URL returned' });
            }
        } catch (error) {
            console.error('OpenAI API Error:', error);
            res.status(500).json({ 
                error: 'Internal Server Error', 
                details: error.message,
                stack: error.stack
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}
