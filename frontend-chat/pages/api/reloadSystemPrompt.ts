import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Read the file directly instead of using require
    const systemPromptPath = path.join(process.cwd(), 'config', 'systemPrompt.json');
    const fileContent = await fs.readFile(systemPromptPath, 'utf-8');
    const systemPrompt = JSON.parse(fileContent);

    res.status(200).json({ 
      message: 'System prompt reloaded successfully',
      systemPrompt 
    });
  } catch (error) {
    console.error('Error reloading system prompt:', error);
    res.status(500).json({ message: 'Error reloading system prompt' });
  }
} 