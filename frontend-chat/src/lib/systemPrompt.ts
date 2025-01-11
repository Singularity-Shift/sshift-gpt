interface SystemPrompt {
  role: string;
  content: string;
}

export async function updateSystemPrompt(content: string): Promise<boolean> {
  try {
    const updatedSystemPrompt: SystemPrompt = {
      role: "system",
      content
    };

    const response = await fetch('/api/updateSystemPrompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedSystemPrompt),
    });

    if (!response.ok) {
      throw new Error('Failed to update system prompt');
    }

    // Reload the system prompt
    const reloadResponse = await fetch('/api/reloadSystemPrompt', {
      method: 'POST',
    });

    if (!reloadResponse.ok) {
      throw new Error('Failed to reload system prompt');
    }

    return true;
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return false;
  }
} 