import { Signal, RevenueResult } from './types';
/**
 * Analyzes signals to extract revenue impact.
 *
 * Keywords for lost revenue: lost, cancelled, canceled, downgraded, churned, terminated
 * Keywords for at-risk: at risk, downgrade, budget cut, reducing, scaling back
 *
 * Currency format: $1,234.56 or 1234.56 or $1234
 */
export declare function analyzeRevenue(signals: Signal[]): RevenueResult;
//# sourceMappingURL=revenueEngine.d.ts.map