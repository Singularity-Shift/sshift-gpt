import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Import the uuid package

// Disable Next.js's default body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Initialize formidable to parse the incoming form data
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing the files');
        return res.status(500).json({ error: 'Error parsing the files' });
      }

      // Access the uploaded file
      const file = files.file;

      // Read the credentials JSON file to get the project ID
      const credentialsPath = path.join(process.cwd(), 'credentials/sshiftdao-ai-38be1dbd83df.json');
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      const projectId = credentials.project_id;

      // Set up Google Cloud Storage
      const storage = new Storage({
        projectId: projectId,
        keyFilename: credentialsPath,
      });

      const bucketName = 'sshift-gpt-bucket'; // Replace with your bucket name
      const bucket = storage.bucket(bucketName);

      // Generate a unique filename using UUID
      const extension = path.extname(file.originalFilename);
      const filename = `${uuidv4()}${extension}`;

      // Create a write stream to upload the file
      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        gzip: true,
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Read the file and pipe it to Google Cloud Storage
      fs.createReadStream(file.filepath)
        .pipe(blobStream)
        .on('error', (err) => {
          console.error('Upload error:', err);
          res.status(500).json({ error: 'Upload error' });
        })
        .on('finish', () => {
          // The public URL can be used to access the file via HTTP.
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          res.status(200).json({ url: publicUrl });
        });
    });
  } else {
    // Handle any other HTTP method
    res.status(405).json({ error: 'Method not allowed' });
  }
}
