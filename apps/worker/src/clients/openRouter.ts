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

    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          signal: controller.signal,
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

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody: any = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`OpenRouter error (${response.status}): ${errorBody.message}`);
        }

        const data: any = await response.json();
        return data.choices[0].message.content ? JSON.parse(data.choices[0].message.content).themes : [];
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (attempt === 2) throw error;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Should not reach here');
  }
}
