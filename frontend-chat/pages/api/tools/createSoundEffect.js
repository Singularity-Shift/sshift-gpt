import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { createElevenLabsClient } from '../elvenlabsClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, duration_seconds = null, prompt_influence = 1.0 } = req.body;

    console.log('Generating sound effect with prompt:', text);

    // Create ElevenLabs client instance
    const elevenLabs = createElevenLabsClient(process.env.ELVEN_API_KEY);

    // Generate sound effect
    const response = await elevenLabs.generateSoundEffect(text, {
      duration_seconds,
      prompt_influence
    });

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Create a sanitized filename from the text
    const sanitizedText = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);
    
    const filename = `${sanitizedText}-${uuidv4()}.mp3`;
    const bucketName = 'sshift-gpt-bucket';

    const storage = new Storage({
      projectId: 'sshiftdao-ai',
      keyFilename: process.env.KEY_FILE_PATH
    });

    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(filename);

    // Set up the upload with proper metadata
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
        prompt: text
      }
    });

    // Handle upload errors
    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Upload error', details: err.message });
    });

    // Handle upload success
    blobStream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
        
        console.log('Upload successful:', publicUrl);
        return res.status(200).json({
          url: publicUrl,
          duration_seconds: duration_seconds || 'auto',
          text: text,
          prompt: text,
          description: `Sound effect generated using the prompt: "${text}"`
        });
      } catch (error) {
        console.error('Error getting public URL:', error);
        return res.status(500).json({ error: 'Failed to get public URL', details: error.message });
      }
    });

    // Write the buffer to the upload stream
    blobStream.end(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Sound effect generation error:', error);
    return res.status(500).json({ error: 'Failed to generate sound effect', details: error.message });
  }
}
