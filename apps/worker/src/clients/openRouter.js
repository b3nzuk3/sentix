"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterClient = void 0;
/**
 * OpenRouter AI Client for theme extraction
 */
const prompts_1 = require("@sentix/prompts");
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
class OpenRouterClient {
    apiKey;
    baseUrl;
    model;
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
    async extractThemes(context) {
        const prompt = prompts_1.themeExtractionPrompt.build(context);
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`OpenRouter error ${response.status}: ${errorBody.message}`);
                }
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('Invalid response: missing content');
                }
                const parsed = JSON.parse(content);
                if (!parsed.themes || !Array.isArray(parsed.themes)) {
                    throw new Error('Invalid response: themes array missing');
                }
                return parsed.themes;
            }
            catch (error) {
                if (shouldRetry(error, attempt)) {
                    const delay = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        throw new Error('Max retries exceeded');
    }
}
exports.OpenRouterClient = OpenRouterClient;
function shouldRetry(error, attempt) {
    if (attempt >= MAX_RETRIES - 1)
        return false;
    // Network errors and 5xx are retryable
    if (error.message.includes('aborted'))
        return true; // timeout
    if (error.message.includes('OpenRouter error 5'))
        return true;
    // Don't retry 4xx (client errors)
    if (error.message.includes('OpenRouter error 4'))
        return false;
    // For fetch rejections (network errors), retry
    return true;
}
//# sourceMappingURL=openRouter.js.map