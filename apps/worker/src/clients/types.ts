export interface Theme {
  title: string;
  confidence: number;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

import type { Context as PromptContext } from '@sentix/prompts';

export interface ExtractionContext extends PromptContext {
  existing_themes?: unknown[];
}
