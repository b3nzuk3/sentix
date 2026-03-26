import { Signal } from '../engines/types';

/**
 * Extract a normalized deal identifier from a signal
 * Supports HubSpot, Zendesk, Jira via metadata conventions
 */
export function extractDealId(signal: Signal): string | null {
  const meta = signal.metadata || {};

  // HubSpot: deal_id or dealId
  if (signal.source_type === 'HUBSPOT') {
    return meta.deal_id || meta.dealId || null;
  }

  // Zendesk: ticket_id
  if (signal.source_type === 'ZENDESK') {
    return meta.ticket_id || meta.id || null;
  }

  // Jira: issue_key
  if (signal.source_type === 'JIRA') {
    return meta.issue_key || meta.key || null;
  }

  // Generic: look for any common deal identifier fields
  return meta.deal_id || meta.dealId || meta.ticket_id || meta.issue_key || null;
}

/**
 * Extract a normalized account identifier from a signal
 * Prefers account_name; can also look for organization IDs in metadata
 */
export function extractAccountId(signal: Signal): string | null {
  if (signal.account_name) {
    return signal.account_name.trim().toLowerCase();
  }

  const meta = signal.metadata || {};

  // HubSpot: company_id or company
  if (signal.source_type === 'HUBSPOT') {
    return meta.company_id || meta.company || null;
  }

  // Zendesk: organization_id or requester.email domain?
  if (signal.source_type === 'ZENDESK') {
    return meta.organization_id || meta.requester?.email?.split('@')[1] || null;
  }

  // Jira: organization or reporter email domain
  if (signal.source_type === 'JIRA') {
    return meta.organization || meta.reporter?.emailAddress?.split('@')[1] || null;
  }

  return null;
}

/**
 * Count entities represented in a set of signals
 */
export interface EntityCounts {
  deals: number;
  accounts: number;
  mentions: number; // total signals
}

export function countEntities(signals: Signal[]): EntityCounts {
  const dealIds = new Set<string>();
  const accountIds = new Set<string>();

  for (const signal of signals) {
    const dealId = extractDealId(signal);
    if (dealId) {
      dealIds.add(dealId);
    }

    const accountId = extractAccountId(signal);
    if (accountId) {
      accountIds.add(accountId);
    }
  }

  return {
    deals: dealIds.size,
    accounts: accountIds.size,
    mentions: signals.length,
  };
}
