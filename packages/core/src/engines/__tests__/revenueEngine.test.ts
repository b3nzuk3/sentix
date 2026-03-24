import { analyzeRevenue } from '../revenueEngine';

interface Signal {
  id: string;
  text: string;
  account_name?: string;
  created_at: Date;
  project_id: string;
  source_type: string; // Using string to simplify for now
  signal_type?: string;
  metadata?: Record<string, any>;
}

describe('Revenue Engine', () => {
  const signals: Signal[] = [
    {
      id: '1',
      text: 'We lost a $50,000 deal due to the bug',
      account_name: 'Acme Corp',
      created_at: new Date(),
      project_id: 'proj1',
      source_type: 'TRANSCRIPT',
      signal_type: 'BUG'
    },
    {
      id: '2',
      text: 'Customer cancelled their $12,500 subscription',
      account_name: 'Beta Inc',
      created_at: new Date(),
      project_id: 'proj1',
      source_type: 'SLACK',
      signal_type: 'COMPLAINT'
    },
    {
      id: '3',
      text: 'No revenue impact mentioned here',
      account_name: 'Gamma LLC',
      created_at: new Date(),
      project_id: 'proj1',
      source_type: 'MANUAL',
      signal_type: 'FEATURE_REQUEST'
    }
  ];

  it('extracts total lost revenue from signals', () => {
    const result = analyzeRevenue(signals as any);
    expect(result.total_lost).toBe(62500);
  });

  it('extracts revenue at risk from signals', () => {
    const result = analyzeRevenue(signals as any);
    expect(result.at_risk).toBe(0);
  });

  it('handles empty array', () => {
    const result = analyzeRevenue([] as any);
    expect(result.total_lost).toBe(0);
    expect(result.at_risk).toBe(0);
  });

  it('recognizes "at risk" keywords (downgraded, budget cut)', () => {
    const atRiskSignals: Signal[] = [
      {
        id: '4',
        text: 'Customer downgraded from $10,000 plan',
        account_name: 'Delta Co',
        created_at: new Date(),
        project_id: 'proj1',
        source_type: 'HUBSPOT',
        signal_type: 'COMPLAINT'
      },
      {
        id: '5',
        text: 'Budget cut of $25,000 impacted renewal',
        account_name: 'Echo Ltd',
        created_at: new Date(),
        project_id: 'proj1',
        source_type: 'ZENDESK',
        signal_type: 'QUESTION'
      }
    ];
    const result = analyzeRevenue(atRiskSignals as any);
    expect(result.at_risk).toBe(35000);
    expect(result.total_lost).toBe(0);
  });

  it('handles malformed currency amounts gracefully', () => {
    const malformedSignals: Signal[] = [
      {
        id: '6',
        text: 'Lost about 50k dollars',
        account_name: 'Foxtrot Inc',
        created_at: new Date(),
        project_id: 'proj1',
        source_type: 'JIRA',
        signal_type: 'BUG'
      }
    ];
    const result = analyzeRevenue(malformedSignals as any);
    expect(result.total_lost).toBe(0);
  });

  it('ignores revenue amounts in non-lost contexts', () => {
    const noiseSignals: Signal[] = [
      {
        id: '7',
        text: 'We have a $100,000 customer who is happy',
        account_name: 'Golf Corp',
        created_at: new Date(),
        project_id: 'proj1',
        source_type: 'TRANSCRIPT',
        signal_type: 'PRAISE'
      }
    ];
    const result = analyzeRevenue(noiseSignals as any);
    expect(result.total_lost).toBe(0);
    expect(result.at_risk).toBe(0);
  });
});
