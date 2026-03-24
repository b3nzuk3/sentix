import { analyze } from '../churnEngine';

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

describe('Churn Engine', () => {
  it('calculates churn risk based on complaint frequency and severity', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Critical bug: cannot login, blocking work',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'SLACK',
        signal_type: 'BUG'
      },
      {
        id: '2',
        text: 'Urgent: system down, losing deals',
        account_name: 'Beta',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'TRANSCRIPT',
        signal_type: 'COMPLAINT'
      },
      {
        id: '3',
        text: 'Major issue with reports',
        account_name: 'Gamma',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'HUBSPOT',
        signal_type: 'BUG'
      },
      {
        id: '4',
        text: 'Minor bug in UI',
        account_name: 'Delta',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'JIRA',
        signal_type: 'BUG'
      }
    ];

    const result = analyze(signals as any);
    // 1 critical (3x), 1 urgent (2x), 1 major (1.5x), 1 minor (1x) -> total weight = 7.5
    // Threshold normalization: assume threshold of 2 complains = 1.0 risk
    // Expected: min(1.0, 7.5 / 2) = 1.0 (capped at 1)
    expect(result.risk).toBeCloseTo(1.0, 1);
  });

  it('returns 0 for no complaints', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Feature request: add dark mode',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'SLACK',
        signal_type: 'FEATURE_REQUEST'
      }
    ];
    const result = analyze(signals as any);
    expect(result.risk).toBe(0);
  });

  it('weights severity correctly', () => {
    const signals: Signal[] = [
      {
        id: '1',
        text: 'Blocking issue - cannot pay invoice (critical)',
        account_name: 'Acme',
        created_at: new Date(),
        project_id: 'p1',
        source_type: 'TRANSCRIPT',
        signal_type: 'COMPLAINT'
      }
    ];
    const result = analyze(signals as any);
    // Critical = 3x weight. Threshold 2 => 3/2 = 1.5 -> capped to 1.0
    expect(result.risk).toBeCloseTo(1.0, 1);
  });

  it('handles empty array', () => {
    const result = analyze([] as any);
    expect(result.risk).toBe(0);
  });
});
