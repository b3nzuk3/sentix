/**
 * Parse uploaded signal file content (CSV, JSON, TXT)
 */
export function parseSignalFile(
  content: string,
  filename: string
): Array<{ text: string; source_type?: string; account_name?: string; metadata?: any }> {
  const ext = filename.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'json') {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data
          .map((item: any) => ({
            text: item.text || item.content || item.message || '',
            source_type: item.source_type,
            account_name: item.account_name,
            metadata: item.metadata || item,
          }))
          .filter((item: any) => item.text);
      }
      // Single JSON object
      return [
        {
          text: data.text || data.content || data.message || '',
          source_type: data.source_type,
          account_name: data.account_name,
          metadata: data.metadata || data,
        },
      ].filter((item: any) => item.text);
    }

    if (ext === 'csv') {
      const lines = content.trim().split('\n');
      if (lines.length < 2) return [];

      // Check if first line is header
      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      const hasHeader = headers.includes('text') || headers.includes('content') || headers.includes('message');

      const records: any[] = [];

      if (hasHeader) {
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h: string, idx: number) => (obj[h] = values[idx]));
          records.push(obj);
        }
      } else {
        // Assume each line is a signal text
        return lines
          .filter((line: string) => line.trim())
          .map((line: string) => ({ text: line.trim() }));
      }

      return records
        .map((item: any) => ({
          text: item.text || item.content || item.message || '',
          source_type: item.source_type,
          account_name: item.account_name,
          metadata: item,
        }))
        .filter((item: any) => item.text);
    }

    // TXT or unknown - treat each non-empty line as a signal
    return content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line)
      .map((text: string) => ({ text }));
  } catch (error) {
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
