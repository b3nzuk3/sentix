import { PriorityInputs, PriorityResult, RoadmapBucket } from './types';
import { calculateConfidence } from './confidenceEngine';

/**
 * Decides roadmap priority based on revenue impact, churn risk, effort, and entity metrics.
 *
 * Core decision matrix (evaluated in order):
 * 1. IF effort=LOW AND revenue_lost > 0 → NOW (0.9)
 * 2. IF revenue_lost ≥ 10000 → NOW (0.9)
 * 3. IF churn_probability ≥ 0.7 → NOW (0.8)
 * 4. IF revenue_at_risk ≥ 5000 → NEXT (0.7)
 * 5. IF effort=LOW → LATER (0.6)
 * 6. DEFAULT → LATER (0.5)
 *
 * Entity weighting (applied after base decision):
 * - Confidence boosted based on deal count:
 *   • ≥2 deals → high (0.95)
 *   • 1 deal  → medium (0.75)
 *   • 0 deals → low (0.4)
 * - Priority bucket boosted:
 *   • Any deals or accounts can upgrade LATER → NEXT
 */
export function decide(inputs: PriorityInputs): PriorityResult {
  const {
    revenue_lost,
    revenue_at_risk,
    churn_probability,
    effort_bucket,
    entityDealCount = 0,
    entityAccountCount = 0
  } = inputs;

  // Base decision
  let bucket: RoadmapBucket;
  let baseConfidence: number;

  // Rule 1: Quick win
  if (effort_bucket === 'LOW' && revenue_lost > 0) {
    bucket = 'NOW';
    baseConfidence = 0.9;
  }
  // Rule 2: High lost revenue
  else if (revenue_lost >= 10000) {
    bucket = 'NOW';
    baseConfidence = 0.9;
  }
  // Rule 3: High churn risk
  else if (churn_probability >= 0.7) {
    bucket = 'NOW';
    baseConfidence = 0.8;
  }
  // Rule 4: At-risk revenue
  else if (revenue_at_risk >= 5000) {
    bucket = 'NEXT';
    baseConfidence = 0.7;
  }
  // Rule 5: Low effort
  else if (effort_bucket === 'LOW') {
    bucket = 'LATER';
    baseConfidence = 0.6;
  }
  // Rule 6: Default
  else {
    bucket = 'LATER';
    baseConfidence = 0.5;
  }

  // Apply entity-based confidence boost using ConfidenceEngine
  const { score: dealConfidence } = calculateConfidence({
    affectedDeals: entityDealCount,
    affectedAccounts: entityAccountCount,
    mentions: entityDealCount + entityAccountCount // approximate; actual signal count would be passed separately
  });
  const confidence = Math.max(baseConfidence, dealConfidence);

  // Apply entity-based bucket weighting
  if ((entityDealCount > 0 || entityAccountCount > 0) && bucket === 'LATER') {
    bucket = 'NEXT';
  }

  return { bucket, confidence };
}
