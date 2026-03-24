import { decide } from '../priorityEngine';

describe('Priority Engine', () => {
  it('prioritizes LOW effort with revenue lost as NOW', () => {
    const result = decide({ revenue_lost: 5000, revenue_at_risk: 0, churn_probability: 0.2, effort_bucket: 'LOW' });
    expect(result.bucket).toBe('NOW');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('prioritizes high revenue lost as NOW', () => {
    const result = decide({ revenue_lost: 15000, revenue_at_risk: 0, churn_probability: 0.1, effort_bucket: 'HIGH' });
    expect(result.bucket).toBe('NOW');
    expect(result.confidence).toBe(0.9);
  });

  it('prioritizes high churn probability as NOW', () => {
    const result = decide({ revenue_lost: 0, revenue_at_risk: 0, churn_probability: 0.8, effort_bucket: 'MEDIUM' });
    expect(result.bucket).toBe('NOW');
    expect(result.confidence).toBe(0.8);
  });

  it('assigns NEXT for significant revenue at risk', () => {
    const result = decide({ revenue_lost: 0, revenue_at_risk: 6000, churn_probability: 0.3, effort_bucket: 'MEDIUM' });
    expect(result.bucket).toBe('NEXT');
    expect(result.confidence).toBe(0.7);
  });

  it('assigns LATER for LOW effort without revenue', () => {
    const result = decide({ revenue_lost: 0, revenue_at_risk: 0, churn_probability: 0.1, effort_bucket: 'LOW' });
    expect(result.bucket).toBe('LATER');
    expect(result.confidence).toBe(0.6);
  });

  it('assigns LATER as default', () => {
    const result = decide({ revenue_lost: 0, revenue_at_risk: 0, churn_probability: 0.1, effort_bucket: 'HIGH' });
    expect(result.bucket).toBe('LATER');
    expect(result.confidence).toBe(0.5);
  });
});
