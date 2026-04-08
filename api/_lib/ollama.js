/**
 * Ollama Cloud Service Utility
 * Implements the technical recommendations (V3.1 protocol)
 */

const API_KEY = process.env.OLLAMA_API_KEY;
const BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/api';

/**
 * Exponential backoff helper
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function ollamaChat({
  model = 'deepseek-v3.1:671b',
  messages = [],
  format = 'json',
  options = { temperature: 0.0, num_ctx: 32768 },
  retries = 3,
  timeout = 45000
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Ollama-Cloud-V3': 'true' // Recommended for pinning stability
        },
        body: JSON.stringify({
          model,
          messages,
          format,
          options,
          stream: false // We want complete response for backend processing
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle specific retryable errors
      if (response.status === 429 || response.status === 503) {
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Ollama biased: Status ${response.status}. Retrying in ${delay}ms...`);
          await wait(delay);
          attempt++;
          continue;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ollama API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Ollama request timed out after 45s');
      }
      
      if (attempt < retries) {
        attempt++;
        await wait(Math.pow(2, attempt) * 500);
        continue;
      }
      
      throw error;
    }
  }
}
