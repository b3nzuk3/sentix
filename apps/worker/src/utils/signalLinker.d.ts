export declare class SignalLinker {
    private stopWords;
    private stemCache;
    constructor();
    linkSignals(theme: {
        title: string;
        reason: string;
        evidence?: string[];
    }, signals: Array<{
        id: string;
        text: string;
    }>): Array<{
        id: string;
        text: string;
    }>;
    tokenize(text: string): string[];
    stem(word: string): string;
    computeIDF(docs: string[][]): Map<string, number>;
    computeTFIDF(tokens: string[], idf: Map<string, number>): Map<string, number>;
    cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number;
}
//# sourceMappingURL=signalLinker.d.ts.map