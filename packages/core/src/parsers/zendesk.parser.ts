export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

/**
 * Zendesk parser for ticket exports (JSON or CSV)
 */
export function parseZendesk(content: string, filename: string): ParsedSignal[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const data = JSON.parse(content);
    const tickets = Array.isArray(data) ? data : [data];

    return tickets
      .map((ticket: any) => ({
        text: ticket.description || ticket.subject || '',
        source_type: 'ZENDESK',
        account_name: ticket.requester?.name || ticket.requester?.email,
        metadata: ticket,
      }))
      .filter(signal => signal.text);
  }

  // CSV fallback
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
      text: record.description || record.subject || '',
      source_type: 'ZENDESK',
      account_name: record.requester_name || record.requester_email,
      metadata: record,
    }))
    .filter(signal => signal.text);
}
