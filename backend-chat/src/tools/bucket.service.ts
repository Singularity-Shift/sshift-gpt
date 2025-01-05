import { Storage } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid package
import fetch from 'node-fetch';

@Injectable()
export class BucketService {
  logger = new Logger(BucketService.name);

  constructor(private readonly storage: Storage) {}

  async uploadImageToBucket(imageUrl: string) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();

    const bucketName = 'sshift-gpt-bucket';
    const filename = `${uuidv4()}-generated-image.png`;

    const bucket = this.storage.bucket(bucketName);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      },
    });

    const url = await new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error('Upload error:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log('Upload successful:', publicUrl);
        resolve({ url: publicUrl });
      });

      blobStream.end(Buffer.from(buffer));
    });

    return url;
  }
}
