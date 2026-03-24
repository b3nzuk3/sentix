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

export interface ExtractionContext {
  project: {
    name: string;
    description: string;
  };
  signals: Array<{
    id: string;
    text: string;
    source: string;
    account?: string;
  }>;
  existing_themes?: any[];
  past_decisions?: any[];
  personas?: any[];
  architectureComponents?: any[];
}
