import { PriorityResult } from './types';
interface Inputs {
    revenue_lost: number;
    revenue_at_risk: number;
    churn_probability: number;
    effort_bucket: 'HIGH' | 'MEDIUM' | 'LOW';
}
/**
 * Decides roadmap priority based on revenue impact, churn risk, and effort.
 *
 * Decision matrix (evaluated in order):
 * 1. IF effort=LOW AND revenue_lost > 0 → NOW (0.9)
 * 2. IF revenue_lost ≥ 10000 → NOW (0.9)
 * 3. IF churn_probability ≥ 0.7 → NOW (0.8)
 * 4. IF revenue_at_risk ≥ 5000 → NEXT (0.7)
 * 5. IF effort=LOW → LATER (0.6)
 * 6. DEFAULT → LATER (0.5)
 */
export declare function decide(inputs: Inputs): PriorityResult;
export {};
//# sourceMappingURL=priorityEngine.d.ts.map