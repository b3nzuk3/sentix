export type SignalSource = string;
export type SignalCategory = string;
export interface Signal {
    id: string;
    text: string;
    account_name?: string;
    created_at: Date;
    project_id: string;
    source_type: SignalSource;
    signal_type?: SignalCategory;
    metadata?: Record<string, any>;
}
export interface RevenueResult {
    total_lost: number;
    at_risk: number;
}
export interface ChurnResult {
    risk: number;
}
export interface EffortResult {
    bucket: 'HIGH' | 'MEDIUM' | 'LOW';
    estimate: number;
}
export type RoadmapBucket = 'NOW' | 'NEXT' | 'LATER';
export interface PriorityResult {
    bucket: RoadmapBucket;
    confidence: number;
}
export interface PriorityResult {
    bucket: 'NOW' | 'NEXT' | 'LATER';
    confidence: number;
}
//# sourceMappingURL=types.d.ts.map