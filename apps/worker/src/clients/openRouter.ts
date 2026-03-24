/**
 * OpenRouter AI Client for theme extraction
 */
import { themeExtractionPrompt } from '@sentix/prompts';

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'stepfun/step-3.5-flash:free';
  }

  /**
   * Extract themes from signals using OpenRouter AI
   */
  async extractThemes(context: any): Promise<{ title: string; confidence: number }[]> {
    const prompt = themeExtractionPrompt.build(context);

    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let response: Response | null = null;
      try {
        response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sentix.io',
            'X-Title': 'Sentix'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`OpenRouter error (${response.status}): ${(errorBody as any).message}`);
        }

        const data = await response.json() as any;
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);
        
        // Extract themes with title and confidence only
        return (parsed.themes || []).map((theme: any) => ({
          title: theme.title,
          confidence: theme.confidence
        }));
      } catch (error: any) {
        // If we got a response (API error or parsing error), throw immediately - no retry
        if (response) {
          throw error;
        }
        // Network error (fetch rejected before returning Response)
        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        // All retries exhausted
        throw new Error('Unknown error after retries');
      }
    }

    // This should never be reached
    throw new Error('Unknown error after retries');
  }
}
