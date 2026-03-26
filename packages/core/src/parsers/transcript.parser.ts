export interface ParsedSignal {
  text: string;
  source_type?: string;
  account_name?: string;
  metadata?: Record<string, any>;
}

/**
 * Transcript parser for plain text meeting transcripts
 * Treats each non-empty line as a signal.
 * Optionally can parse "Speaker: Text" format.
 */
export function parseTranscript(content: string): ParsedSignal[] {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  // Try to detect "Speaker: Message" format
  const speakerRegex = /^([^:]+):\s*(.+)$/;

  const signals: ParsedSignal[] = [];

  for (const line of lines) {
    const match = line.match(speakerRegex);
    if (match) {
      const [, speaker, text] = match;
      signals.push({
        text,
        source_type: 'TRANSCRIPT',
        account_name: speaker,
        metadata: { raw_line: line },
      });
    } else {
      signals.push({
        text: line,
        source_type: 'TRANSCRIPT',
        metadata: { raw_line: line },
      });
    }
  }

  return signals;
}
