export interface SynthesizeJobData {
    analysis_id: string;
    project_id: string;
    user_id: string;
}
export interface IngestJobData {
    project_id: string;
    signals: Array<{
        source_type: string;
        text: string;
        account_name?: string;
        metadata?: Record<string, any>;
    }>;
}
//# sourceMappingURL=types.d.ts.map