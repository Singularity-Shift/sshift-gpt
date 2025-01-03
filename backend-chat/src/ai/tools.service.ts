import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Response } from 'express';

@Injectable()
export class ToolsService {
  private logger = new Logger(ToolsService.name);
  constructor() {}

  async createSoundEffect(
    text: string,
    duration_seconds: number,
    prompt_influence: number,
    res: Response
  ) {
    console.log('Generating sound effect with prompt:', text);

    // Create ElevenLabs client instance
    const elevenLabs = createElevenLabsClient(process.env.ELVEN_API_KEY);

    // Generate sound effect
    const response = await elevenLabs.generateSoundEffect(text, {
      duration_seconds,
      prompt_influence,
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

    const credentialOptions: any = {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    };

    const storage = new Storage({
      projectId: 'sshiftdao-ai',
      credentials: credentialOptions,
    });

    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(filename);

    // Set up the upload with proper metadata
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
        prompt: text,
      },
    });

    // Handle upload errors
    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      return res
        .status(500)
        .json({ error: 'Upload error', details: err.message });
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
          description: `Sound effect generated using the prompt: "${text}"`,
        });
      } catch (error) {
        console.error('Error getting public URL:', error);
        return res
          .status(500)
          .json({ error: 'Failed to get public URL', details: error.message });
      }
    });

    // Write the buffer to the upload stream
    blobStream.end(Buffer.from(audioBuffer));
  }
}
