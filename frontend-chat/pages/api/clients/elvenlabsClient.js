export class ElevenLabsClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  // Generic request method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'xi-api-key': this.apiKey,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
      }

      return response;
    } catch (error) {
      console.error(`ElevenLabs API error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Sound effect generation method
  async generateSoundEffect(text, options = {}) {
    const { duration_seconds = null, prompt_influence = 1.0 } = options;

    return this.makeRequest('/sound-generation', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        duration_seconds,
        prompt_influence
      })
    });
  }

  // Add other ElevenLabs API methods here as needed
  // For example:
  // async textToSpeech() {...}
  // async getVoices() {...}
  // etc.
}

// Create and export a singleton instance
export const createElevenLabsClient = (apiKey) => {
  return new ElevenLabsClient(apiKey);
};
