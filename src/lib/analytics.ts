// This module exists because: the previous /analytics page read from a
// permanently-empty `outcomes` array (the original diagnostic flagged this).
// Phase 5 derives every honest metric from `PipelineLead.stageHistory` —
// which we now stamp on every transition. That makes the dashboard true even
// for users who've never thought about analytics, and means the brief's KPIs
// (calls booked, proposals sent, deals closed, revenue, conversion rates)
// are computable from a single source.

import type { PipelineLead, LinkedInPost, PipelineStage, StageTransition } from './types';

// -----------------------------------------------------------------------------
// Time-range helpers — used by every metric below.
// -----------------------------------------------------------------------------

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export function thisMonth(now: Date = new Date()): TimeRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end, label: 'This month' };
}

export function lastMonth(now: Date = new Date()): TimeRange {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end, label: 'Last month' };
}

export function thisWeek(now: Date = new Date()): TimeRange {
  // ISO-style: week starts Monday. Avoids the "Sunday vs Monday" debate.
  const day = (now.getDay() + 6) % 7; // 0 = Mon
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end, label: 'This week' };
}

export function lastWeek(now: Date = new Date()): TimeRange {
  const tw = thisWeek(now);
  const start = new Date(tw.start);
  start.setDate(start.getDate() - 7);
  return { start, end: tw.start, label: 'Last week' };
}

// -----------------------------------------------------------------------------
// Stage-transition selectors. The contract: a transition is "in range" if its
// `at` timestamp falls inside [start, end). Leads created before Phase 5
// don't have stageHistory; we treat their current stage as a single
// transition stamped at `createdAt`. That under-counts but doesn't lie.
// -----------------------------------------------------------------------------

export function leadHistory(lead: PipelineLead): StageTransition[] {
  if (lead.stageHistory && lead.stageHistory.length > 0) return lead.stageHistory;
  // Legacy lead with no history — synthesize from current stage + createdAt.
  return [{ stage: lead.stage, at: lead.createdAt }];
}

export function transitionsToStage(leads: PipelineLead[], stage: PipelineStage, range: TimeRange): { lead: PipelineLead; at: string }[] {
  const start = range.start.getTime();
  const end = range.end.getTime();
  const out: { lead: PipelineLead; at: string }[] = [];
  for (const lead of leads) {
    for (const t of leadHistory(lead)) {
      if (t.stage !== stage) continue;
      const ts = new Date(t.at).getTime();
      if (isNaN(ts)) continue;
      if (ts >= start && ts < end) out.push({ lead, at: t.at });
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// The 7 honest KPIs from the brief.
// -----------------------------------------------------------------------------

export interface DashboardMetrics {
  range: TimeRange;
  callsBooked: number;
  proposalsSent: number;
  dealsClosed: number;
  revenueClosed: number;
  // Diagnostic conversion rates — null when the denominator is 0.
  replyToCallRate: number | null;
  callToProposalRate: number | null;
  proposalToCloseRate: number | null;
  // Raw counts used in the conversion math (handy for tooltips).
  repliesInRange: number;
}

export function computeMetrics(leads: PipelineLead[], range: TimeRange): DashboardMetrics {
  const replies = transitionsToStage(leads, 'replied', range).length;
  const calls = transitionsToStage(leads, 'meeting', range).length;
  const proposals = transitionsToStage(leads, 'proposal', range).length;
  const wonTransitions = transitionsToStage(leads, 'closed-won', range);
  const won = wonTransitions.length;

  const revenue = wonTransitions.reduce((sum, t) => sum + (t.lead.dealAmount ?? 0), 0);

  const safeRate = (num: number, den: number) => (den > 0 ? num / den : null);

  return {
    range,
    callsBooked: calls,
    proposalsSent: proposals,
    dealsClosed: won,
    revenueClosed: revenue,
    replyToCallRate: safeRate(calls, replies),
    callToProposalRate: safeRate(proposals, calls),
    proposalToCloseRate: safeRate(won, proposals),
    repliesInRange: replies,
  };
}

// -----------------------------------------------------------------------------
// Days-since-last helpers — drives "What's Stuck" warnings.
// -----------------------------------------------------------------------------

export function daysSince(stamp: string | undefined, now: Date = new Date()): number | null {
  if (!stamp) return null;
  const t = new Date(stamp).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
}

export function daysSinceLastTransitionTo(leads: PipelineLead[], stage: PipelineStage, now: Date = new Date()): number | null {
  let mostRecent: number | null = null;
  for (const lead of leads) {
    for (const t of leadHistory(lead)) {
      if (t.stage !== stage) continue;
      const ts = new Date(t.at).getTime();
      if (isNaN(ts)) continue;
      if (mostRecent === null || ts > mostRecent) mostRecent = ts;
    }
  }
  if (mostRecent === null) return null;
  return Math.max(0, Math.floor((now.getTime() - mostRecent) / 86_400_000));
}

export function daysSinceLastPost(posts: LinkedInPost[], now: Date = new Date()): number | null {
  let mostRecent: number | null = null;
  for (const p of posts) {
    const ts = new Date(p.createdAt).getTime();
    if (isNaN(ts)) continue;
    if (mostRecent === null || ts > mostRecent) mostRecent = ts;
  }
  if (mostRecent === null) return null;
  return Math.max(0, Math.floor((now.getTime() - mostRecent) / 86_400_000));
}

// -----------------------------------------------------------------------------
// "What's Stuck" — items the user is letting rot. Each item is a discrete
// nudge the dashboard can render, sorted by severity.
// -----------------------------------------------------------------------------

export type StuckItemKind =
  | 'replied-stale'      // a lead in `replied` stage > 3 days
  | 'meeting-stale'      // a lead in `meeting` stage > 7 days
  | 'proposal-stale'     // a lead in `proposal` stage > 5 days
  | 'no-call-recently'   // > 7 days since last call booked
  | 'no-post-recently';  // > 4 days since last post

export interface StuckItem {
  kind: StuckItemKind;
  severity: 'critical' | 'warning';
  message: string;          // user-visible
  daysOld: number;
  leadId?: string;          // when the item is about a specific lead
}

const STAGE_THRESHOLDS: Partial<Record<PipelineStage, { kind: StuckItemKind; days: number; criticalDays: number }>> = {
  'replied':  { kind: 'replied-stale',  days: 3, criticalDays: 7 },
  'meeting':  { kind: 'meeting-stale',  days: 7, criticalDays: 14 },
  'proposal': { kind: 'proposal-stale', days: 5, criticalDays: 10 },
};

export function whatsStuck(
  leads: PipelineLead[],
  posts: LinkedInPost[],
  now: Date = new Date(),
): StuckItem[] {
  const out: StuckItem[] = [];

  // 1. Per-lead stalls — lead has been in a sensitive stage too long.
  for (const lead of leads) {
    const config = STAGE_THRESHOLDS[lead.stage];
    if (!config) continue;
    // "How long in this stage" = time since the most recent transition INTO
    // this stage. updatedAt is a noisier proxy (notes/sequence updates touch
    // it), so we trust stageHistory when available.
    const enteredAt = lastEntryTo(lead, lead.stage) ?? lead.updatedAt;
    const days = daysSince(enteredAt, now);
    if (days === null || days < config.days) continue;
    const severity = days >= config.criticalDays ? 'critical' : 'warning';
    const fullName = `${lead.firstName} ${lead.lastName}`.trim() || lead.company || 'Unknown lead';
    out.push({
      kind: config.kind,
      severity,
      daysOld: days,
      leadId: lead.id,
      message: `${fullName} has been in ${lead.stage} for ${days} day${days === 1 ? '' : 's'} — owe them a move`,
    });
  }

  // 2. Top-of-funnel: no calls booked recently.
  const daysSinceCall = daysSinceLastTransitionTo(leads, 'meeting', now);
  if (daysSinceCall === null || daysSinceCall > 7) {
    const days = daysSinceCall ?? 999;
    out.push({
      kind: 'no-call-recently',
      severity: days >= 14 || daysSinceCall === null ? 'critical' : 'warning',
      daysOld: days,
      message: daysSinceCall === null
        ? "No call booked yet — top of funnel isn't producing"
        : `${days} days since the last call was booked — top of funnel may be broken`,
    });
  }

  // 3. Authority decay: no post recently.
  const daysSincePost = daysSinceLastPost(posts, now);
  if (daysSincePost === null || daysSincePost > 4) {
    const days = daysSincePost ?? 999;
    out.push({
      kind: 'no-post-recently',
      severity: days >= 10 || daysSincePost === null ? 'critical' : 'warning',
      daysOld: days,
      message: daysSincePost === null
        ? "No post yet — authority isn't building"
        : `${days} days since your last post — authority is decaying`,
    });
  }

  // Sort: critical → warning, then oldest first.
  out.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return b.daysOld - a.daysOld;
  });
  return out;
}

function lastEntryTo(lead: PipelineLead, stage: PipelineStage): string | null {
  let latest: string | null = null;
  let latestTs = -Infinity;
  for (const t of leadHistory(lead)) {
    if (t.stage !== stage) continue;
    const ts = new Date(t.at).getTime();
    if (isNaN(ts)) continue;
    if (ts > latestTs) {
      latestTs = ts;
      latest = t.at;
    }
  }
  return latest;
}

// -----------------------------------------------------------------------------
// Compare two ranges — drives the weekly "Truth" review.
// -----------------------------------------------------------------------------

export interface MetricsComparison {
  current: DashboardMetrics;
  previous: DashboardMetrics;
  /** Percentage change for each KPI; null when previous = 0. */
  deltas: {
    callsBooked: number | null;
    proposalsSent: number | null;
    dealsClosed: number | null;
    revenueClosed: number | null;
    replyToCallRate: number | null;
    callToProposalRate: number | null;
    proposalToCloseRate: number | null;
  };
}

export function compareMetrics(current: DashboardMetrics, previous: DashboardMetrics): MetricsComparison {
  const pct = (cur: number, prev: number): number | null => {
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  };
  const pctNullable = (cur: number | null, prev: number | null): number | null => {
    if (cur === null || prev === null || prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  };
  return {
    current, previous,
    deltas: {
      callsBooked:        pct(current.callsBooked,        previous.callsBooked),
      proposalsSent:      pct(current.proposalsSent,      previous.proposalsSent),
      dealsClosed:        pct(current.dealsClosed,        previous.dealsClosed),
      revenueClosed:      pct(current.revenueClosed,      previous.revenueClosed),
      replyToCallRate:    pctNullable(current.replyToCallRate,    previous.replyToCallRate),
      callToProposalRate: pctNullable(current.callToProposalRate, previous.callToProposalRate),
      proposalToCloseRate: pctNullable(current.proposalToCloseRate, previous.proposalToCloseRate),
    },
  };
}

// -----------------------------------------------------------------------------
// Format helpers
// -----------------------------------------------------------------------------

export function formatRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatRevenue(amount: number): string {
  if (amount === 0) return '$0';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

export function formatDelta(pct: number | null): string {
  if (pct === null) return '';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}
