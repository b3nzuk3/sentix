export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

import { parseHubspot } from './hubspot.parser';
import { parseZendesk } from './zendesk.parser';
import { parseJira } from './jira.parser';
import { parseTranscript } from './transcript.parser';
import { parseGeneric } from './generic.parser';

export { parseHubspot, parseZendesk, parseJira, parseTranscript, parseGeneric };

/**
 * Parse content based on source type
 * @param content - Raw file content
 * @param sourceType - The source type (HUBSPOT, ZENDESK, JIRA, TRANSCRIPT, etc.)
 * @param filename - Optional filename for extension detection in generic parser
 */
export function parse(
  content: string,
  sourceType: string,
  filename?: string
): ParsedSignal[] {
  switch (sourceType) {
    case 'HUBSPOT':
      return parseHubspot(content);
    case 'ZENDESK':
      return parseZendesk(content, filename || '');
    case 'JIRA':
      return parseJira(content);
    case 'TRANSCRIPT':
      return parseTranscript(content);
    default:
      // Unknown source type, use generic parser
      return parseGeneric(content, filename || '', sourceType);
  }
}
