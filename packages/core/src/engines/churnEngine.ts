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
export function analyze(signals: Signal[]): ChurnResult {
  let weightedSum = 0;

  const severityWeights: Record<string, number> = {
    critical: 3,
    blocking: 3,
    urgent: 2,
    major: 1.5,
    // default weight 1 for any complaint not matching above
  };

  const threshold = 2; // weighted sum that equals 100% risk

  for (const signal of signals) {
    const text = signal.text.toLowerCase();

    // Only consider complaints, bugs, or negative sentiment signals
    const negativeTypes = ['COMPLAINT', 'BUG'];
    if (!signal.signal_type || !negativeTypes.includes(signal.signal_type)) {
      continue;
    }

    // Determine severity weight
    let weight = 1; // default
    for (const [severity, w] of Object.entries(severityWeights)) {
      if (text.includes(severity)) {
        weight = w;
        break;
      }
    }

    weightedSum += weight;
  }

  const risk = Math.min(1.0, weightedSum / threshold);

  return { risk };
}
