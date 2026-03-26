export type SignalSource = string; // TODO: tighten to union type
export type SignalCategory = string; // TODO: tighten to union type

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
  risk: number; // 0-1
}

export interface EffortResult {
  bucket: 'HIGH' | 'MEDIUM' | 'LOW';
  estimate: number; // days
}

export type RoadmapBucket = 'NOW' | 'NEXT' | 'LATER';

export interface PriorityInputs {
  revenue_lost: number;
  revenue_at_risk: number;
  churn_probability: number; // 0-1
  effort_bucket: 'HIGH' | 'MEDIUM' | 'LOW';
  entityDealCount?: number;
  entityAccountCount?: number;
}

export interface PriorityResult {
  bucket: RoadmapBucket;
  confidence: number; // 0-1
}
