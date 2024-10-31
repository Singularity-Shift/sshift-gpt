import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, duration_seconds = null, prompt_influence = 1.0 } = req.body;

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

    // Create sounds directory if it doesn't exist
    const soundsDir = path.join(process.cwd(), 'public', 'sounds');
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${uuidv4()}.mp3`;
    const filepath = path.join(soundsDir, filename);

    // Save the file
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, audioBuffer);

    // Return the public URL
    const publicUrl = `/sounds/${filename}`;
    return res.status(200).json({
      url: publicUrl,
      duration_seconds: duration_seconds || 'auto',
      text: text
    });

  } catch (error) {
    console.error('Sound effect generation error:', error);
    return res.status(500).json({ error: 'Failed to generate sound effect', details: error.message });
  }
}
