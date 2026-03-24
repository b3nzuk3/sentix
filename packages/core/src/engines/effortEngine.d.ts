import { Signal, EffortResult } from './types';
interface Theme {
    title: string;
    summary?: string;
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
export declare function estimate(theme: Theme, signals: Signal[]): EffortResult;
export {};
//# sourceMappingURL=effortEngine.d.ts.map