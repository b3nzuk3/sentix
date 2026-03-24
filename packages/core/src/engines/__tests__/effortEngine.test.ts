import { estimate } from '../effortEngine';

interface Signal {
  id: string;
  text: string;
  account_name?: string;
  created_at: Date;
  project_id: string;
  source_type: string;
  signal_type?: string;
  metadata?: Record<string, any>;
}

describe('Effort Engine', () => {
  it('classifies HIGH effort for infrastructure/auth/compliance keywords', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Need SAML/SSO integration for enterprise',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'SLACK',
        signal_type: 'FEATURE_REQUEST'
      }
    ];
    const result = estimate({ title: 'Implement SAML SSO' }, signals as any);
    expect(result.bucket).toBe('HIGH');
    expect(result.estimate).toBeGreaterThanOrEqual(5);
  });

  it('classifies MEDIUM effort for API/performance/bug keywords', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'API response times are too slow',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'JIRA',
        signal_type: 'BUG'
      }
    ];
    const result = estimate({ title: 'Fix API performance' }, signals as any);
    expect(result.bucket).toBe('MEDIUM');
    expect(result.estimate).toBeGreaterThanOrEqual(2);
    expect(result.estimate).toBeLessThanOrEqual(4);
  });

  it('classifies LOW effort for UI/UX/copy/styling keywords', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Button color doesn\'t match brand guidelines',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'ZENDESK',
        signal_type: 'QUESTION'
      }
    ];
    const result = estimate({ title: 'Fix button color' }, signals as any);
    expect(result.bucket).toBe('LOW');
    expect(result.estimate).toBeLessThan(2);
  });

  it('defaults to MEDIUM when no keywords match', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Some vague requirement',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'MANUAL',
        signal_type: 'FEATURE_REQUEST'
      }
    ];
    const result = estimate({ title: 'Generic feature' }, signals as any);
    expect(result.bucket).toBe('MEDIUM');
    expect(result.estimate).toBeGreaterThanOrEqual(2);
  });

  it('handles empty signals array', () => {
    const result = estimate({ title: 'Unknown' }, [] as any);
    expect(result.bucket).toBe('MEDIUM');
  });

  it('combines multiple signals to influence estimate', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Need responsive layout',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'SLACK',
        signal_type: 'FEATURE_REQUEST'
      },
      {
        id: '2',
        text: 'Add dark mode support',
        account_name: 'Beta',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'TRANSCRIPT',
        signal_type: 'FEATURE_REQUEST'
      }
    ];
    const result = estimate({ title: 'UI improvements' }, signals as any);
    expect(result.bucket).toBe('LOW');
    expect(result.estimate).toBeLessThan(2);
  });
});
