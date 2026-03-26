export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

/**
 * HubSpot parser for CSV exports
 * Expected columns: Email, Company, Message, etc.
 */
export function parseHubspot(content: string): ParsedSignal[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: any = {};
    headers.forEach((h, idx) => obj[h] = values[idx]);
    records.push(obj);
  }

  return records
    .map(record => ({
      text: record.message || record.content || record.text || '',
      source_type: 'HUBSPOT',
      account_name: record.company || record.email,
      metadata: record,
    }))
    .filter(signal => signal.text);
}
