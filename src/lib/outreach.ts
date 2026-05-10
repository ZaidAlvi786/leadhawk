// This module exists because: AI-generated outreach is now everywhere, so the
// only messages that get replies are the ones that DON'T look generated. The
// 4-component structure (specific reference, pattern interrupt, earned right,
// low-friction ask) is the format that survives a spam-saturated inbox.
// These helpers run the format check before the user hits copy — it's cheaper
// to refuse a bad message than to send 100 of them and wonder why nobody
// replied.

import type { OutreachComponents, SendReadinessReport, CheckResult } from './types';

export const MAX_CONNECTION_LENGTH = 300;

/**
 * Phrases the brief explicitly bans. Most are sales clichés that signal
 * "this is from a template" before the prospect's eye reaches the second line.
 */
export const BANNED_PHRASES = [
  'hope this finds you well',
  'quick question',
  'circle back',
  'synergy',
  'leverage',          // verb usage; we'll match word-boundary-ish
  'i came across your profile',
  'i wanted to reach out',
  'just checking in',
  'touch base',
  'low-hanging fruit',
  'move the needle',
];

/**
 * Phrases that betray a high-friction CTA. The prospect will read these as
 * "I want 30 minutes of your day before I've earned 30 seconds."
 */
export const HIGH_FRICTION_CTA_PHRASES = [
  '30-min call',
  '30 min call',
  '15-min call',
  '15 min call',
  'discovery call',
  'discovery chat',
  'jump on a call',
  'hop on a call',
  'get on a call',
  'set up a meeting',
  'schedule a meeting',
  'book a meeting',
  'find a time',
  'pick your brain',
];

/**
 * Phrases that suggest the CTA IS low-friction — used to give the AI/user a
 * positive example set, not validated against directly.
 */
export const LOW_FRICTION_CTA_EXAMPLES = [
  'worth me sending the 2-min loom?',
  'want me to send the teardown?',
  'is this still a priority for Q3?',
  'open to a reply if useful?',
  'should I send the one-pager?',
];

// -----------------------------------------------------------------------------
// Individual check functions — each returns {ok, reason?}.
// Pure, easy to test. Used by the assembled report below.
// -----------------------------------------------------------------------------

export function checkLength(message: string, max: number = MAX_CONNECTION_LENGTH): CheckResult {
  const len = message.length;
  if (len <= max) return { ok: true };
  return { ok: false, reason: `${len}/${max} chars — trim ${len - max} more` };
}

export function checkSpecificReference(
  components: Pick<OutreachComponents, 'specificReference' | 'sourceFieldIds'>
): CheckResult {
  const ref = components.specificReference?.trim() || '';
  if (ref.length < 10) {
    return { ok: false, reason: 'No specific reference — must name something real about the prospect' };
  }
  if (!components.sourceFieldIds || components.sourceFieldIds.length === 0) {
    return { ok: false, reason: 'Reference is not tied to a research source — likely fabricated' };
  }
  return { ok: true };
}

export function checkBannedPhrases(message: string): CheckResult {
  const lower = message.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    // Word-boundary-ish: the phrase must appear as a contiguous run.
    if (lower.includes(phrase)) {
      return { ok: false, reason: `Contains "${phrase}"` };
    }
  }
  return { ok: true };
}

export function checkDoesNotStartWithI(message: string): CheckResult {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, reason: 'Empty message' };
  // Match a leading "I " or "I'" or "I'm" — case-insensitive.
  if (/^i[\s']/i.test(trimmed)) {
    return { ok: false, reason: 'Starts with "I" — open with the prospect, not yourself' };
  }
  return { ok: true };
}

export function checkCtaIsLowFriction(ctaText: string): CheckResult {
  const lower = ctaText.toLowerCase();
  for (const phrase of HIGH_FRICTION_CTA_PHRASES) {
    if (lower.includes(phrase)) {
      return { ok: false, reason: `CTA contains "${phrase}" — too heavy for cold outreach` };
    }
  }
  // Also reject CTAs > 25 words — a long ask is a heavy ask.
  const wordCount = ctaText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 25) {
    return { ok: false, reason: `CTA is ${wordCount} words — keep it under 25` };
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Aggregate readiness report — what the UI binds to.
// -----------------------------------------------------------------------------

export function runSendReadinessChecks(components: OutreachComponents): SendReadinessReport {
  const message = components.assembledMessage;
  const underLengthLimit = checkLength(message);
  const hasSpecificReference = checkSpecificReference(components);
  const noBannedPhrases = checkBannedPhrases(message);
  const doesNotStartWithI = checkDoesNotStartWithI(message);
  const ctaIsLowFriction = checkCtaIsLowFriction(components.lowFrictionAsk || '');

  const checks = [underLengthLimit, hasSpecificReference, noBannedPhrases, doesNotStartWithI, ctaIsLowFriction];
  const passed = checks.filter((c) => c.ok).length;

  return {
    underLengthLimit,
    hasSpecificReference,
    noBannedPhrases,
    doesNotStartWithI,
    ctaIsLowFriction,
    passed,
    total: checks.length,
  };
}

// -----------------------------------------------------------------------------
// Local fallback assembler. The AI returns assembledMessage too, but if the
// user edits a single component we want to be able to re-stitch on the
// client without another AI roundtrip.
// -----------------------------------------------------------------------------

export function assembleComponents(c: Pick<OutreachComponents, 'specificReference' | 'patternInterrupt' | 'earnedRight' | 'lowFrictionAsk'>): string {
  const parts = [c.specificReference, c.patternInterrupt, c.earnedRight, c.lowFrictionAsk]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  // Single newline between components — short enough to feel like a single
  // human note, structured enough that the format is visible.
  return parts.join('\n\n');
}

// -----------------------------------------------------------------------------
// Reply classification labels — used by the UI to render a chip + playbook.
// -----------------------------------------------------------------------------

export const REPLY_CLASS_LABELS: Record<import('./types').ReplyClassification, { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  'interested':       { label: 'Interested',         tone: 'good' },
  'objection-price':  { label: 'Price objection',    tone: 'warn' },
  'objection-timing': { label: 'Timing objection',   tone: 'warn' },
  'objection-fit':    { label: 'Fit objection',      tone: 'warn' },
  'objection-trust':  { label: 'Trust objection',    tone: 'warn' },
  'referral-out':     { label: 'Referral out',       tone: 'neutral' },
  'polite-no':        { label: 'Polite no',          tone: 'bad' },
  'ghosting-risk':    { label: 'Ghosting risk',      tone: 'warn' },
  'other':            { label: 'Other',              tone: 'neutral' },
};
