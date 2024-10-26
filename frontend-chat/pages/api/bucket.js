import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid package
import path from 'path';

// Disable Next.js's default body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const form = formidable({
        multiples: true,
        maxFileSize: 50 * 1024 * 1024,
        uploadDir: '/tmp',
        keepExtensions: true,
      });

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      console.log('Fields:', fields);
      console.log('Files:', files);

      if (!files.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      console.log('File:', file);

      const filepath = file.filepath;
      console.log('File path:', filepath);

      if (!filepath) {
        console.error('File path is undefined');
        return res.status(500).json({ error: 'File path is undefined' });
      }

      // ... rest of your code for uploading to Google Cloud Storage ...

      // For example:
      const filename = `${uuidv4()}-${file.originalFilename}`;
      const bucketName = 'sshift-gpt-bucket'; // Replace with your bucket name

      // Set up Google Cloud Storage
      console.log('Setting up Google Cloud Storage...');
      const storage = new Storage({
        projectId: 'sshiftdao-ai', // This should be your project ID
        keyFilename: process.env.KEY_FILE_PATH
      });

      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        gzip: true,
        metadata: {
          contentType: file.mimetype,
        },
      });

      fs.createReadStream(filepath)
        .pipe(blobStream)
        .on('error', (err) => {
          console.error('Upload error:', err);
          res.status(500).json({ error: 'Upload error', details: err.message });
        })
        .on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          console.log('Upload successful:', publicUrl);
          res.status(200).json({ url: publicUrl });
        });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
