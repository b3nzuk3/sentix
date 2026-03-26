import { Signal } from './types';

/**
 * Confidence engine: computes confidence score and level based on entity metrics.
 *
 * Deterministic rules:
 * - ≥2 deals → high (0.95)
 * - 1 deal → medium (0.75)
 * - 0 deals → low (0.4)
 *
 * The confidence reflects how strongly a theme is grounded in actual deal data.
 * More deals = higher confidence that the issue is real and revenue-impacting.
 */

export interface ConfidenceInput {
  affectedDeals: number;
  affectedAccounts: number;
  mentions: number;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
}

export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const { affectedDeals } = input;

  let score: number;
  let level: ConfidenceLevel;

  if (affectedDeals >= 2) {
    score = 0.95;
    level = 'high';
  } else if (affectedDeals === 1) {
    score = 0.75;
    level = 'medium';
  } else {
    score = 0.4;
    level = 'low';
  }

  return { score, level };
}
