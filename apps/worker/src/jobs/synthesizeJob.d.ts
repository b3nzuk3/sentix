import { Job } from 'bullmq';
export declare function processSynthesizeJob(job: Job<any>): Promise<{
    analysis_id: any;
    status: string;
    theme_count?: undefined;
} | {
    analysis_id: any;
    theme_count: number;
    status?: undefined;
}>;
//# sourceMappingURL=synthesizeJob.d.ts.map