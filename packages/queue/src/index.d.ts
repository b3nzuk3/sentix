import { Queue } from 'bullmq';
import { SynthesizeJobData, IngestJobData } from './types';
export declare const synthesizeQueue: Queue<SynthesizeJobData, any, string, SynthesizeJobData, any, string>;
export declare const ingestQueue: Queue<IngestJobData, any, string, IngestJobData, any, string>;
export declare const queueScheduler: any;
export declare function getConnection(): any;
//# sourceMappingURL=index.d.ts.map