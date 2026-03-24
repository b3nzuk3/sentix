import { Signal, ChurnResult } from './types';
/**
 * Analyzes signals to estimate churn risk.
 *
 * Scans for complaint frequency and severity markers.
 *
 * Severity weight multipliers:
 * - critical, blocking: 3x
 * - urgent: 2x
 * - major: 1.5x
 * - default (minor/low): 1x
 *
 * Formula: risk = min(1.0, (sum of weighted complaints) / threshold)
 * Threshold: 2 weighted complaints = risk 1.0 (full risk)
 */
export declare function analyzeChurn(signals: Signal[]): ChurnResult;
//# sourceMappingURL=churnEngine.d.ts.map