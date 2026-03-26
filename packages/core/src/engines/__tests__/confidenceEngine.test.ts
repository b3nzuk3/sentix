import { calculateConfidence } from '../confidenceEngine';

describe('Confidence Engine', () => {
  it('returns high confidence for ≥2 deals', () => {
    const result = calculateConfidence({ affectedDeals: 2, affectedAccounts: 3, mentions: 10 });
    expect(result.level).toBe('high');
    expect(result.score).toBe(0.95);
  });

  it('returns high confidence for more than 2 deals', () => {
    const result = calculateConfidence({ affectedDeals: 5, affectedAccounts: 2, mentions: 20 });
    expect(result.level).toBe('high');
    expect(result.score).toBe(0.95);
  });

  it('returns medium confidence for exactly 1 deal', () => {
    const result = calculateConfidence({ affectedDeals: 1, affectedAccounts: 5, mentions: 3 });
    expect(result.level).toBe('medium');
    expect(result.score).toBe(0.75);
  });

  it('returns low confidence for 0 deals, regardless of accounts or mentions', () => {
    const result = calculateConfidence({ affectedDeals: 0, affectedAccounts: 10, mentions: 100 });
    expect(result.level).toBe('low');
    expect(result.score).toBe(0.4);
  });

  it('handles zero entities across the board', () => {
    const result = calculateConfidence({ affectedDeals: 0, affectedAccounts: 0, mentions: 0 });
    expect(result.level).toBe('low');
    expect(result.score).toBe(0.4);
  });
});
