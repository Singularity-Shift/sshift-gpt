import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, duration_seconds = null, prompt_influence = 1.0 } = req.body;

    console.log('Generating sound effect with prompt:', text);

    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELVEN_API_KEY
      },
      body: JSON.stringify({
        text,
        duration_seconds,
        prompt_influence
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Create a sanitized filename from the text
    const sanitizedText = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50); // Limit length
    
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
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        // Add the original prompt as metadata
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
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
        
        console.log('Upload successful:', publicUrl);
        return res.status(200).json({
          url: publicUrl,
          duration_seconds: duration_seconds || 'auto',
          text: text,
          prompt: text, // Include the original prompt in the response
          description: `Sound effect generated using the prompt: "${text}"` // Add a human-readable description
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
