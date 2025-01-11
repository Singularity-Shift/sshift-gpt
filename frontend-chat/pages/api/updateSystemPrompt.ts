import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { role, content } = req.body;

    // Validate the input
    if (!role || !content || role !== 'system') {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const systemPromptPath = path.join(process.cwd(), 'config', 'systemPrompt.json');
    
    // Write the new content to the file
    await fs.writeFile(
      systemPromptPath,
      JSON.stringify({ role, content }, null, 2),
      'utf-8'
    );

    res.status(200).json({ message: 'System prompt updated successfully' });
  } catch (error) {
    console.error('Error updating system prompt:', error);
    res.status(500).json({ message: 'Error updating system prompt' });
  }
} 