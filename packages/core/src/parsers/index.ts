export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

export { parseHubspot } from './hubspot.parser';
export { parseZendesk } from './zendesk.parser';
export { parseJira } from './jira.parser';
export { parseTranscript } from './transcript.parser';
export { parseGeneric } from './generic.parser';

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
