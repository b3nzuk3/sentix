import type { Theme, ExtractionContext } from './types';
export declare class OpenRouterClient {
    private apiKey;
    private baseUrl;
    private model;
    constructor();
    /**
     * Extract themes from signals using OpenRouter AI
     */
    extractThemes(context: ExtractionContext): Promise<Theme[]>;
}
//# sourceMappingURL=openRouter.d.ts.map