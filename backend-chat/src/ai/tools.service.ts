import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Response } from 'express';
import { ConfigService } from '../share/config/config.service';
import { ElevenLabsService } from './elevenlabs.service';

@Injectable()
export class ToolsService {
  private logger = new Logger(ToolsService.name);
  constructor(
    private elevenLabsService: ElevenLabsService,
    private configService: ConfigService,
    private storage: Storage
  ) {}

  async createSoundEffect(
    text: string,
    duration_seconds: number,
    prompt_influence: number,
    res: Response
  ) {
    this.logger.log('Generating sound effect with prompt:', text);

    // Generate sound effect
    const response = await this.elevenLabsService.generateSoundEffect(
      text,
      duration_seconds,
      prompt_influence
    );

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Create a sanitized filename from the text
    const sanitizedText = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);

    const filename = `${sanitizedText}-${uuidv4()}.mp3`;
    const bucketName = 'sshift-gpt-bucket';

    const bucket = this.storage.bucket(bucketName);
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
