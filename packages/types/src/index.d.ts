export interface User {
    id: string;
    email: string;
    name: string;
    organization_id: string;
    role: 'ADMIN' | 'MEMBER';
    created_at: Date;
}
export interface Organization {
    id: string;
    name: string;
    slug: string;
    settings?: {
        retention_days?: number;
        timezone?: string;
        i18n?: {
            locales: string[];
        };
    };
    created_at: Date;
}
export interface Team {
    id: string;
    name: string;
    organization_id: string;
    created_at: Date;
}
export interface Project {
    id: string;
    name: string;
    description?: string;
    organization_id: string;
    team_id?: string;
    created_at: Date;
    _count?: {
        signals: number;
        analyses: number;
    };
}
export interface Signal {
    id: string;
    project_id: string;
    source_type: string;
    text: string;
    account_name?: string;
    signal_type?: string;
    metadata?: Record<string, any>;
    created_at: Date;
}
export interface Theme {
    id: string;
    project_id: string;
    title: string;
    summary?: string;
    confidence?: number;
    created_at: Date;
}
export interface AnalysisTheme {
    id: string;
    analysis_id: string;
    theme_id: string;
    title: string;
    roadmap_bucket: 'NOW' | 'NEXT' | 'LATER';
    revenue_lost: number;
    revenue_at_risk: number;
    churn_probability: number;
    effort_days: number;
    effort_bucket: 'SMALL' | 'MEDIUM' | 'LARGE';
    confidence: number;
    evidence_ids: string[];
    engine_outputs: {
        revenue: {
            total_lost: number;
            at_risk: number;
        };
        churn: {
            risk: number;
        };
        effort: {
            bucket: string;
            estimate: number;
        };
        priority: {
            bucket: string;
            confidence: number;
        };
    };
    created_at: Date;
    theme: Theme;
}
export interface Analysis {
    id: string;
    project_id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    total_revenue_lost: number;
    total_revenue_at_risk: number;
    theme_count: number;
    error_message?: string;
    created_at: Date;
    updated_at: Date;
    themes?: AnalysisTheme[];
}
export interface AuthResponse {
    user: User;
    org: Organization;
    tokens: {
        access_token: string;
        refresh_token: string;
    };
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    org_name: string;
    user_name: string;
}
export interface SignalUploadResult {
    count: number;
    signals: Array<{
        project_id: string;
        source_type: string;
        text: string;
        account_name?: string;
        metadata?: any;
    }>;
}
export interface SynthesisJobResponse {
    job_id: string;
    analysis_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
}
export interface JobStatusResponse {
    status: string;
    result?: {
        analysis_id: string;
    };
    error?: {
        message: string;
    };
    progress?: {
        current: number;
        total: number;
    };
}
//# sourceMappingURL=index.d.ts.map