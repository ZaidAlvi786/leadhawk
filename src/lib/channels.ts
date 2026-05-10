// This module exists because: Operating Principle #5 says inbound and
// outbound are one system, but the brief's Phase 6 also makes a sharper
// point — Sales Navigator alone won't get this user clients. Top operators
// run a portfolio of channels (cold + warm + inbound) and *know their
// mix*. These pure helpers (a) recommend channels based on positioning,
// (b) parse light structure out of pasted source data so capture is
// frictionless, and (c) classify each lead into the cold/warm/inbound
// bucket so the Channel Mix Coach can call out imbalance.

import type { LeadSource, PipelineLead, UserPositioning, WarmContact } from './types';
import { isPositioningComplete } from './positioning';

// -----------------------------------------------------------------------------
// 6.1 — Channel recommendations based on positioning.
// -----------------------------------------------------------------------------

export type ChannelKind =
  | 'sales-navigator'
  | 'yc-jobs'
  | 'wellfound'
  | 'social-search'
  | 'funding-news'
  | 'warm-intros'
  | 'linkedin-content'
  | 'twitter-content';

export interface ChannelRecommendation {
  kind: ChannelKind;
  label: string;
  rationale: string;          // why THIS positioning maps to this channel
  priority: number;           // 1 = highest. Used for sort order.
}

/**
 * Returns a ranked list of channels for the user's positioning. The ranking
 * isn't a black box — each entry has a `rationale` so the user understands
 * why we're suggesting it. Honest about Sales Nav's weaknesses for indie /
 * AI / intent-driven motions.
 */
export function recommendedChannels(positioning: UserPositioning | null | undefined): ChannelRecommendation[] {
  if (!isPositioningComplete(positioning) || !positioning) {
    // Without positioning we can't rank — return a generic ordering.
    return [
      { kind: 'warm-intros',      label: 'Warm intros',                priority: 1, rationale: 'Highest conversion rate of any channel — start here while you build positioning.' },
      { kind: 'linkedin-content', label: 'LinkedIn content',           priority: 2, rationale: 'Build authority before pushing cold.' },
      { kind: 'sales-navigator',  label: 'Sales Navigator',            priority: 3, rationale: 'Generic recommendation — finalize positioning for a sharper rank.' },
    ];
  }

  const company = positioning.targetCompanyType.toLowerCase();
  const role = positioning.targetRole.toLowerCase();

  // Heuristic signals — these are the patterns the brief calls out. They
  // are NOT a model; they are explicit rules the user can argue with.
  const looksEnterprise = /(enterprise|fortune|public company|fortune 500|1000\+|large)/.test(company);
  const looksEarlyStage = /(seed|pre-seed|series [ab]\b|early[- ]stage|startup|founder)/.test(company);
  const looksTechnical = /(engineer|developer|devops|sre|ai|ml|data|cto|architect)/.test(role);
  const looksGrowth = /(marketing|growth|head of marketing|cmo|demand)/.test(role);
  const looksFunded = /(funded|series [a-e]\b|raised)/.test(company);

  const recs: ChannelRecommendation[] = [];

  // Warm intros: top-of-list for almost everyone — but especially indie/early-stage.
  recs.push({
    kind: 'warm-intros',
    label: 'Warm intros',
    priority: 1,
    rationale: 'Highest conversion rate, lowest cost. Beginners who skip this waste months on cold DMs to colder people.',
  });

  // Sales Nav: only highly-rated for enterprise / large TAM
  if (looksEnterprise) {
    recs.push({
      kind: 'sales-navigator',
      label: 'Sales Navigator',
      priority: 2,
      rationale: 'Enterprise ICPs have a large enough TAM to justify Sales Nav\'s SDR-style filtering. Use the saved searches.',
    });
  }

  // Early-stage / funded → funding news + YC
  if (looksEarlyStage || looksFunded) {
    recs.push({
      kind: 'funding-news',
      label: 'Funding announcements',
      priority: 2,
      rationale: 'Just-funded companies are buying. Crunchbase/TechCrunch/press feeds put you in front of decisions made this month.',
    });
    recs.push({
      kind: 'yc-jobs',
      label: 'YC Work-at-a-Startup',
      priority: 3,
      rationale: 'Early-stage companies post jobs that signal what they\'re building. Each posting is a discovery call you didn\'t have to schedule.',
    });
    recs.push({
      kind: 'wellfound',
      label: 'Wellfound (AngelList)',
      priority: 3,
      rationale: 'Same intent signal as YC jobs but a different funnel. Worth scanning weekly.',
    });
  }

  // Technical/growth ICPs → LinkedIn content (founders read it; they\'re too busy for cold DMs)
  if (looksTechnical || looksGrowth) {
    recs.push({
      kind: 'linkedin-content',
      label: 'LinkedIn content',
      priority: 2,
      rationale: 'Your ICP reads LinkedIn. Three Pain-naming posts a week shifts the relationship from "another DM" to "I\'ve seen this person\'s work".',
    });
  }

  // Social search: works for anyone with a clear pain pattern
  recs.push({
    kind: 'social-search',
    label: '"Looking for X" social search',
    priority: 4,
    rationale: 'Saved searches for "looking for [your service]" surface in-market buyers monthly. 5 minutes of paste-and-classify > an hour of cold prospecting.',
  });

  // Sales Nav as fallback (lower-rank) for non-enterprise
  if (!looksEnterprise) {
    recs.push({
      kind: 'sales-navigator',
      label: 'Sales Navigator',
      priority: 5,
      rationale: 'Weak fit for indie/AI/services motions — too narrow a TAM, too generic a signal. Use it sparingly, prefer the channels above.',
    });
  }

  // Twitter content for technical audiences
  if (looksTechnical) {
    recs.push({
      kind: 'twitter-content',
      label: 'X / Twitter content',
      priority: 4,
      rationale: 'Technical buyers spend more time on X than LinkedIn. Replies + threads grow distribution faster.',
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

// -----------------------------------------------------------------------------
// 6.3 — Channel Mix Coach
// -----------------------------------------------------------------------------

export type ChannelGroup = 'cold' | 'warm' | 'inbound';

/** Maps a LeadSource into the broader cold/warm/inbound bucket. */
export function classifyChannel(source: LeadSource): ChannelGroup {
  switch (source) {
    case 'inbound':       return 'inbound';
    case 'referral':
    case 'warm-intro':    return 'warm';
    // everything else is some flavour of cold outbound
    case 'apollo':
    case 'linkedin':
    case 'manual':
    case 'yc-jobs':
    case 'wellfound':
    case 'social-search':
    case 'funding-news':
    default:              return 'cold';
  }
}

/** The benchmark mix for a solo / indie operator per the brief. */
export const IDEAL_CHANNEL_MIX: Record<ChannelGroup, number> = {
  cold: 0.30,
  warm: 0.30,
  inbound: 0.40,
};

export interface ChannelMixSummary {
  totals: Record<ChannelGroup, number>;
  ratios: Record<ChannelGroup, number>;
  total: number;
  /** True if any group exceeds 60% (over-reliance) or any group is below 10% (neglect). */
  imbalanced: boolean;
  /** Human-readable flags ranked by severity. */
  warnings: string[];
}

const MAX_DOMINANT_RATIO = 0.6;
const MIN_PRESENCE_RATIO = 0.10;

/**
 * Compute the user's actual channel mix from their pipeline lead history.
 * Uses lead counts as a proxy for "time spent" — imperfect but honest:
 * leads only show up because the user did the work to add them.
 */
export function channelMixSummary(leads: PipelineLead[]): ChannelMixSummary {
  const totals: Record<ChannelGroup, number> = { cold: 0, warm: 0, inbound: 0 };
  for (const lead of leads) {
    totals[classifyChannel(lead.source)] += 1;
  }
  const total = totals.cold + totals.warm + totals.inbound;
  const ratios: Record<ChannelGroup, number> = total === 0
    ? { cold: 0, warm: 0, inbound: 0 }
    : {
        cold: totals.cold / total,
        warm: totals.warm / total,
        inbound: totals.inbound / total,
      };

  const warnings: string[] = [];
  if (total >= 5) {
    // Don't surface warnings until there's enough sample to be meaningful
    for (const group of ['cold', 'warm', 'inbound'] as const) {
      if (ratios[group] > MAX_DOMINANT_RATIO) {
        warnings.push(`${Math.round(ratios[group] * 100)}% of leads are ${group} — top operators stay under ${Math.round(MAX_DOMINANT_RATIO * 100)}%`);
      }
      if (ratios[group] < MIN_PRESENCE_RATIO) {
        warnings.push(`Only ${Math.round(ratios[group] * 100)}% of leads are ${group} — under ${Math.round(MIN_PRESENCE_RATIO * 100)}% means you're effectively ignoring this channel`);
      }
    }
  }

  return {
    totals,
    ratios,
    total,
    imbalanced: warnings.length > 0,
    warnings,
  };
}

// -----------------------------------------------------------------------------
// 6.2 — Light parsers for paste-and-classify ingestion. Regex-only, no AI:
// keeps the round-trip fast, keeps the behaviour predictable, keeps the
// failure mode obvious (the user just sees the field empty and types it in).
// -----------------------------------------------------------------------------

export interface ParsedJobPosting {
  company?: string;
  role?: string;
  url?: string;
  source: 'yc-jobs' | 'wellfound' | 'unknown';
}

const JOB_TITLE_LINE = /^(?:.*?:|.*?\s[-–—]\s)?\s*(senior|staff|principal|lead|founding|chief|head of|vp|vice president|director of|manager|engineer|developer|designer|product|growth|marketing|sales|operations|recruiter|analyst)[^\n]+/im;

/**
 * Parse a YC Work-at-a-Startup or Wellfound job. We accept either a URL
 * or a snippet of the listing text; in both cases we extract whatever we
 * can without scraping.
 */
export function parseJobPosting(input: string): ParsedJobPosting {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
  const url = urlMatch?.[0];

  let source: ParsedJobPosting['source'] = 'unknown';
  if (url && /workatastartup\.com/i.test(url)) source = 'yc-jobs';
  else if (url && /(wellfound|angel\.co|angellist)/i.test(url)) source = 'wellfound';

  // Find a "Company at [Role]" or "Role at Company" pattern — common in
  // pasted listings.
  let company: string | undefined;
  let role: string | undefined;

  const atMatch = trimmed.match(/^([^\n]+?)\s+at\s+([^\n]+?)(?:\s*\||\s*$)/im);
  if (atMatch) {
    // Could be either order; the longer one is usually the role.
    const a = atMatch[1].trim();
    const b = atMatch[2].trim();
    if (a.length > b.length) { role = a; company = b; }
    else { role = b; company = a; }
  }

  // Fallback: try to detect a job title line
  if (!role) {
    const titleMatch = trimmed.match(JOB_TITLE_LINE);
    if (titleMatch) role = titleMatch[0].trim().split('\n')[0];
  }

  // Fallback: take the first non-empty short line as company name
  if (!company) {
    const firstLine = trimmed.split('\n').map((l) => l.trim()).find((l) => l && l.length < 80 && !l.startsWith('http'));
    if (firstLine && firstLine !== role) company = firstLine;
  }

  return { company, role, url, source };
}

export interface ParsedFundingNews {
  company?: string;
  amount?: number;             // in dollars
  stage?: string;              // "Series A", "seed", etc.
  date?: string;               // ISO date if mentioned
  url?: string;
}

const MONEY_RE = /\$\s*(\d+(?:\.\d+)?)\s*(million|m|billion|bn|k|thousand)\b/i;
const SERIES_RE = /\b(pre-seed|seed|series\s+[a-e]|growth|mezzanine)\b/i;
const COMPANY_RAISED_RE = /([A-Z][\w&.\- ]{1,40})\s+(?:has\s+)?raised\b/i;

export function parseFundingNews(input: string): ParsedFundingNews {
  const trimmed = input.trim();
  const url = trimmed.match(/https?:\/\/[^\s]+/)?.[0];

  let amount: number | undefined;
  const moneyMatch = trimmed.match(MONEY_RE);
  if (moneyMatch) {
    const n = parseFloat(moneyMatch[1]);
    const unit = moneyMatch[2].toLowerCase();
    if (unit.startsWith('b')) amount = n * 1_000_000_000;
    else if (unit.startsWith('m')) amount = n * 1_000_000;
    else if (unit.startsWith('k') || unit.startsWith('t')) amount = n * 1_000;
    else amount = n;
  }

  const stage = trimmed.match(SERIES_RE)?.[1];
  const company = trimmed.match(COMPANY_RAISED_RE)?.[1]?.trim();

  return { company, amount, stage, url };
}

export interface ParsedSocialPost {
  authorName?: string;
  excerpt?: string;
  url?: string;
}

/**
 * Parse a single LinkedIn/X post snippet from a "Looking for…" search
 * result. Common pattern is the author's name on the first non-URL line,
 * then the post body.
 */
export function parseSocialPost(input: string): ParsedSocialPost {
  const trimmed = input.trim();
  const url = trimmed.match(/https?:\/\/[^\s]+/)?.[0];

  // First short line that looks like a name (2-4 words, capitalized)
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const nameRe = /^[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+){1,3}$/;
  const authorName = lines.find((l) => nameRe.test(l));

  // Excerpt = first line that contains the trigger phrase or the longest
  // non-author non-URL line.
  let excerpt: string | undefined;
  const triggerLine = lines.find((l) => /\b(looking for|need|hiring|wish (i|we) had|frustrated|stuck on)\b/i.test(l));
  if (triggerLine) excerpt = triggerLine;
  else {
    const candidates = lines.filter((l) => l !== authorName && !l.startsWith('http'));
    excerpt = candidates.sort((a, b) => b.length - a.length)[0];
  }

  return { authorName, excerpt, url };
}

// -----------------------------------------------------------------------------
// Warm intros — staleness signal.
// -----------------------------------------------------------------------------

export const WARM_STALE_DAYS = 30;
export const WARM_VERY_STALE_DAYS = 90;

export function warmStaleness(contact: WarmContact, now: Date = new Date()): 'fresh' | 'stale' | 'very-stale' | 'never' {
  if (!contact.lastTouchedAt) return 'never';
  const days = Math.floor((now.getTime() - new Date(contact.lastTouchedAt).getTime()) / 86_400_000);
  if (days >= WARM_VERY_STALE_DAYS) return 'very-stale';
  if (days >= WARM_STALE_DAYS) return 'stale';
  return 'fresh';
}
