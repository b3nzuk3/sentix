export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

/**
 * Generic parser for CSV, JSON, and TXT files
 * Handles common formats as a fallback
 */
export function parseGeneric(content: string, filename: string, defaultSourceType?: string): ParsedSignal[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'json') {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data
          .map((item: any) => ({
            text: item.text || item.content || item.message || '',
            source_type: item.source_type || defaultSourceType,
            account_name: item.account_name,
            metadata: item.metadata || item,
          }))
          .filter(signal => signal.text);
      }
      // Single JSON object
      return [
        {
          text: data.text || data.content || data.message || '',
          source_type: data.source_type || defaultSourceType,
          account_name: data.account_name,
          metadata: data.metadata || data,
        },
      ].filter(signal => signal.text);
    }

    if (ext === 'csv') {
      const lines = content.trim().split('\n');
      if (lines.length < 2) return [];

      // Check if first line is header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const hasHeader = headers.includes('text') || headers.includes('content') || headers.includes('message');

      const records: any[] = [];

      if (hasHeader) {
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, idx) => obj[h] = values[idx]);
          records.push(obj);
        }
      } else {
        // Assume each line is a signal text
        return lines
          .filter(line => line.trim())
          .map(line => ({ text: line.trim(), source_type: defaultSourceType }));
      }

      return records
        .map(record => ({
          text: record.text || record.content || record.message || '',
          source_type: record.source_type || defaultSourceType,
          account_name: record.account_name,
          metadata: record,
        }))
        .filter(signal => signal.text);
    }

    // TXT or unknown - each non-empty line is a signal
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(text => ({ text, source_type: defaultSourceType }));
  } catch (error) {
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
