export interface Context {
    project: {
        name: string;
        description: string;
    };
    signals: Array<{
        id: string;
        text: string;
        source: string;
        account_name?: string;
    }>;
    personas?: Array<{
        name: string;
        description: string;
    }>;
    architectureComponents?: Array<{
        name: string;
        status?: string;
        description: string;
    }>;
    past_decisions?: Array<{
        title: string;
        description: string;
    }>;
}
export declare const themeExtractionPrompt: {
    template: string;
    build(context: Context): string;
};
//# sourceMappingURL=themeExtraction.d.ts.map