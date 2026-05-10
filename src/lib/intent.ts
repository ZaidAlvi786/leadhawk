// This module exists because: a "Series A SaaS founder" is a demographic, but
// "a Series A SaaS founder who posted yesterday about hiring their first AI
// engineer" is intent. Pipeline conversion gaps almost always trace to
// out-of-date or absent intent signals. These pure helpers keep the data
// model honest: signals have a real timestamp, freshness is computed not
// stored, and cold leads stay visible (so the user *sees* their pipeline rot).

import type { IntentSignal, IntentSignalType } from './types';

export const HOT_FRESHNESS_HOURS = 72;
export const WARM_FRESHNESS_HOURS = 14 * 24;   // 14 days
export const COLD_FRESHNESS_HOURS = 60 * 24;   // 60 days

export type Freshness = 'hot' | 'warm' | 'cool' | 'cold';

/**
 * Hours since the signal occurred. Falls back to capturedAt when occurredAt
 * is missing. Returns Infinity if neither is parseable.
 */
export function freshnessHours(signal: Pick<IntentSignal, 'occurredAt' | 'capturedAt'>, now: Date = new Date()): number {
  const stamp = signal.occurredAt || signal.capturedAt;
  if (!stamp) return Infinity;
  const t = new Date(stamp).getTime();
  if (isNaN(t)) return Infinity;
  return Math.max(0, (now.getTime() - t) / 3_600_000);
}

export function classifyFreshness(hours: number): Freshness {
  if (hours <= HOT_FRESHNESS_HOURS) return 'hot';
  if (hours <= WARM_FRESHNESS_HOURS) return 'warm';
  if (hours <= COLD_FRESHNESS_HOURS) return 'cool';
  return 'cold';
}

/** Pick the freshest signal from a list, or undefined if the list is empty. */
export function freshestSignal(signals: IntentSignal[], now: Date = new Date()): IntentSignal | undefined {
  if (!signals.length) return undefined;
  return signals.reduce((best, s) =>
    freshnessHours(s, now) < freshnessHours(best, now) ? s : best
  );
}

/** Filter signals attached to a specific pipeline lead. */
export function signalsForLead(signals: IntentSignal[], leadId: string): IntentSignal[] {
  return signals.filter((s) => s.leadId === leadId);
}

/** Filter signals attached to a specific watchlist account. */
export function signalsForWatchlist(signals: IntentSignal[], watchlistAccountId: string): IntentSignal[] {
  return signals.filter((s) => s.watchlistAccountId === watchlistAccountId);
}

/**
 * Heuristic classifier: given a snippet of text, guess the IntentSignalType.
 * Always returns *something* (defaults to 'other'). The user can override.
 * This is intentionally simple — we'd rather be wrong-and-correctable than
 * complex-and-opaque.
 */
export function guessSignalType(text: string, url?: string): IntentSignalType {
  const haystack = `${text} ${url || ''}`.toLowerCase();

  // URL-based signals first (most reliable)
  if (url) {
    if (/github\.com\/.+\/(issues|pull|releases)/i.test(url)) return 'github-activity';
    if (/(crunchbase|techcrunch|venturebeat).*funding/i.test(haystack)) return 'funding';
    if (/(linkedin\.com\/jobs|workatastartup|wellfound|angel\.co|jobs\.ashbyhq|greenhouse|lever)/i.test(url)) return 'job-posting';
  }

  // Phrase-based heuristics — rough but useful
  if (/\b(raised|series [a-e]\b|seed round|funding round|led the round|valuation)/i.test(haystack)) {
    return 'funding';
  }
  if (/\b(launch(ed|ing)?|shipped|now available|introducing|new product|version \d|v\d+\.\d)/i.test(haystack)) {
    return 'product-launch';
  }
  if (/\b(hiring|we'?re hiring|looking for|seeking|join our team|open role|new role)/i.test(haystack)) {
    return 'social-hiring';
  }
  if (/\b(struggling|stuck on|painful|frustrated|wish (i|we) had|broken|nightmare|workaround|hack)/i.test(haystack)) {
    return 'social-pain';
  }
  if (/\b(featured in|mentioned in|interview with|podcast|spoke at|talk at)/i.test(haystack)) {
    return 'press-mention';
  }
  return 'other';
}

/** Short human-friendly label for a signal type. */
export function signalTypeLabel(t: IntentSignalType): string {
  const labels: Record<IntentSignalType, string> = {
    'job-posting': 'Job posting',
    'funding': 'Funding event',
    'product-launch': 'Product launch',
    'social-pain': 'Pain post',
    'social-hiring': '"Looking for…"',
    'github-activity': 'GitHub activity',
    'press-mention': 'Press / podcast',
    'other': 'Other signal',
  };
  return labels[t];
}

/** Format hours-old as a short human label: "2h", "3d", "5w", "2mo". */
export function formatFreshness(hours: number): string {
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 14) return `${Math.round(days)}d`;
  const weeks = days / 7;
  if (weeks < 8) return `${Math.round(weeks)}w`;
  const months = days / 30;
  return `${Math.round(months)}mo`;
}
