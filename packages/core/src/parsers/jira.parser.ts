export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

/**
 * Jira parser for issue exports (JSON)
 */
export function parseJira(content: string): ParsedSignal[] {
  const data = JSON.parse(content);
  const issues = Array.isArray(data) ? data : [data];

  return issues
    .map((issue: any) => {
      const fields = issue.fields || issue;
      const text = `${fields.summary || ''}\n${fields.description || ''}`.trim();
      const reporter = fields.reporter || field;
      return {
        text,
        source_type: 'JIRA',
        account_name: reporter?.displayName || reporter?.emailAddress,
        metadata: { issue_key: issue.key || fields.key, ...fields },
      };
    })
    .filter(signal => signal.text);
}
