import { Signal, EffortResult } from './types';

interface Theme {
  title: string;
  summary?: string;
}

function containsWholeWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`);
  return regex.test(text);
}

/**
 * Estimates effort for implementing a solution to a theme.
 *
 * Keyword categorization:
 * - HIGH: auth, security, sso, saml, ldap, compliance, gdpr, migration, database, infrastructure
 * - MEDIUM: bug, performance, latency, search, reporting, export, api
 * - LOW: ui, ux, design, styling, copy, color, font, responsive
 *
 * Story point estimates:
 * - HIGH: 5-8 days -> 6
 * - MEDIUM: 2-4 days -> 3
 * - LOW: 0.5-2 days -> 1
 *
 * Output: { bucket: EffortBucket, estimate: number (days) }
 */
export function estimate(theme: Theme, signals: Signal[]): EffortResult {
  const text = (theme.title + ' ' + (theme.summary || '') + ' ' + signals.map(s => s.text).join(' ')).toLowerCase();

  const highKeywords = ['auth', 'security', 'sso', 'saml', 'ldap', 'compliance', 'gdpr', 'migration', 'database', 'infrastructure', 'encryption', 'audit', 'certification'];
  const mediumKeywords = ['bug', 'performance', 'latency', 'search', 'reporting', 'export', 'api', 'integration', 'webhook', 'caching', 'indexing'];
  const lowKeywords = ['ui', 'ux', 'design', 'styling', 'copy', 'color', 'font', 'responsive', 'mobile', 'layout', 'animation'];

  // Determine bucket by highest severity keyword found (whole word matches only)
  if (highKeywords.some(kw => containsWholeWord(text, kw))) {
    return { bucket: 'HIGH', estimate: 6 };
  }

  if (mediumKeywords.some(kw => containsWholeWord(text, kw))) {
    return { bucket: 'MEDIUM', estimate: 3 };
  }

  if (lowKeywords.some(kw => containsWholeWord(text, kw))) {
    return { bucket: 'LOW', estimate: 1 };
  }

  // Default to MEDIUM when no keywords match (unknown complexity)
  return { bucket: 'MEDIUM', estimate: 3 };
}
