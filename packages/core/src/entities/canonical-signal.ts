/**
 * CanonicalSignal represents a normalized signal entity
 * This is the standard form used throughout the system after parsing
 */
export interface CanonicalSignal {
  text: string;
  source_type: string;
  account_name?: string;
  signal_type?: string;
  metadata?: Record<string, any>;
}
