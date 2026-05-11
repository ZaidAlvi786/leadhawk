// This module exists because: snake_case ↔ camelCase mapping is exactly the
// kind of code that breaks silently when fields drift. Centralizing it
// (with tests) means the repos stay tiny and the type contract is
// enforced at the boundary.
//
// Mapping rules:
//   - snake_case row fields map to camelCase app fields
//   - null in DB → undefined in app (for optional fields)
//   - undefined in app → null in DB writes (Supabase coerces)
//   - JSONB columns store the app shape directly (no inner mapping)

import type {
  UserPositioning, PipelineLead, IntentSignal, LeadResearch,
  WatchlistAccount, WarmContact, LinkedInPost, Tweet, TwitterThread,
} from '../types';
import { POSITIONING_SCHEMA_VERSION } from '../positioning';
import type {
  UserPositioningRow, PipelineLeadRow, IntentSignalRow, LeadResearchRow,
  WatchlistAccountRow, WarmContactRow, LinkedInPostRow, TweetRow, TwitterThreadRow,
} from './rowTypes';

// Helper: coerce nullable-or-missing to undefined for the app side.
const undef = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);
// Inverse: coerce missing app field to null for the DB side.
const nul = <T>(v: T | null | undefined): T | null => (v == null ? null : v);

// =============================================================================
// USER POSITIONING
// =============================================================================

export function positioningFromRow(row: UserPositioningRow): UserPositioning {
  return {
    targetRole: row.target_role,
    targetCompanyType: row.target_company_type,
    painfulProblem: row.painful_problem,
    mechanism: row.mechanism,
    outcomeMetric: row.outcome_metric,
    outcomeTimeframe: row.outcome_timeframe,
    outcomeIsProjected: row.outcome_is_projected,
    proofAssets: row.proof_assets ?? [],
    notFor: row.not_for,
    version: row.version,
    lastUpdated: row.last_updated,
  };
}

export function positioningToRow(p: UserPositioning, userId: string): Omit<UserPositioningRow, 'last_updated'> {
  return {
    user_id: userId,
    target_role: p.targetRole,
    target_company_type: p.targetCompanyType,
    painful_problem: p.painfulProblem,
    mechanism: p.mechanism,
    outcome_metric: p.outcomeMetric,
    outcome_timeframe: p.outcomeTimeframe,
    outcome_is_projected: p.outcomeIsProjected,
    proof_assets: p.proofAssets,
    not_for: p.notFor,
    version: p.version || POSITIONING_SCHEMA_VERSION,
  };
}

// =============================================================================
// PIPELINE LEADS
// =============================================================================

export function leadFromRow(row: PipelineLeadRow): PipelineLead {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title ?? '',
    company: row.company,
    email: row.email ?? '',
    industry: row.industry ?? '',
    source: row.source,
    stage: row.stage,
    notes: row.notes ?? '',
    lastContacted: undef(row.last_contacted),
    nextFollowUp: undef(row.next_follow_up),
    sequenceId: undef(row.sequence_id),
    currentStep: undef(row.current_step),
    aiSuggestedAction: undef(row.ai_suggested_action),
    icpTag: undef(row.icp_tag),
    proposalAmount: undef(row.proposal_amount),
    dealAmount: undef(row.deal_amount),
    stageHistory: row.stage_history ?? [],
    discoveryBrief: undef(row.discovery_brief),
    callDebrief: undef(row.call_debrief),
    proposal: undef(row.proposal),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function leadToRow(lead: PipelineLead, userId: string): PipelineLeadRow {
  return {
    id: lead.id,
    user_id: userId,
    first_name: lead.firstName,
    last_name: lead.lastName,
    title: nul(lead.title),
    company: lead.company,
    email: nul(lead.email),
    industry: nul(lead.industry),
    source: lead.source,
    stage: lead.stage,
    notes: nul(lead.notes),
    last_contacted: nul(lead.lastContacted),
    next_follow_up: nul(lead.nextFollowUp),
    sequence_id: nul(lead.sequenceId),
    current_step: nul(lead.currentStep),
    ai_suggested_action: nul(lead.aiSuggestedAction),
    icp_tag: nul(lead.icpTag),
    proposal_amount: nul(lead.proposalAmount),
    deal_amount: nul(lead.dealAmount),
    stage_history: lead.stageHistory ?? [],
    discovery_brief: nul(lead.discoveryBrief),
    call_debrief: nul(lead.callDebrief),
    proposal: nul(lead.proposal),
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

// =============================================================================
// INTENT SIGNALS
// =============================================================================

export function signalFromRow(row: IntentSignalRow): IntentSignal {
  return {
    id: row.id,
    leadId: undef(row.lead_id),
    watchlistAccountId: undef(row.watchlist_account_id),
    type: row.type,
    title: row.title,
    content: row.content ?? '',
    url: undef(row.url),
    occurredAt: row.occurred_at,
    capturedAt: row.captured_at,
  };
}

export function signalToRow(s: IntentSignal, userId: string): IntentSignalRow {
  return {
    id: s.id,
    user_id: userId,
    lead_id: nul(s.leadId),
    watchlist_account_id: nul(s.watchlistAccountId),
    type: s.type,
    title: s.title,
    content: nul(s.content),
    url: nul(s.url),
    occurred_at: s.occurredAt,
    captured_at: s.capturedAt,
  };
}

// =============================================================================
// LEAD RESEARCH
// =============================================================================

export function researchFromRow(row: LeadResearchRow): LeadResearch {
  return {
    id: row.id,
    leadName: row.lead_name,
    leadCompany: undef(row.lead_company),
    leadRole: undef(row.lead_role),
    linkedinUrl: undef(row.linkedin_url),
    archetype: row.archetype,
    sources: row.sources ?? [],
    summary: row.summary ?? '',
    hooks: row.hooks ?? [],
    bestApproach: row.best_approach ?? '',
    redFlags: row.red_flags ?? [],
    synthesizedAt: undef(row.synthesized_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function researchToRow(r: LeadResearch, userId: string): LeadResearchRow {
  return {
    id: r.id,
    user_id: userId,
    lead_name: r.leadName,
    lead_company: nul(r.leadCompany),
    lead_role: nul(r.leadRole),
    linkedin_url: nul(r.linkedinUrl),
    archetype: r.archetype,
    sources: r.sources,
    summary: nul(r.summary),
    hooks: r.hooks,
    best_approach: nul(r.bestApproach),
    red_flags: r.redFlags,
    synthesized_at: nul(r.synthesizedAt),
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

// =============================================================================
// WATCHLIST ACCOUNTS
// =============================================================================

export function watchlistFromRow(row: WatchlistAccountRow): WatchlistAccount {
  return {
    id: row.id,
    companyName: row.company_name,
    industry: undef(row.industry),
    url: undef(row.url),
    notes: undef(row.notes),
    lastCheckedAt: undef(row.last_checked_at),
    createdAt: row.created_at,
  };
}

export function watchlistToRow(a: WatchlistAccount, userId: string): WatchlistAccountRow {
  return {
    id: a.id,
    user_id: userId,
    company_name: a.companyName,
    industry: nul(a.industry),
    url: nul(a.url),
    notes: nul(a.notes),
    last_checked_at: nul(a.lastCheckedAt),
    created_at: a.createdAt,
  };
}

// =============================================================================
// WARM CONTACTS
// =============================================================================

export function warmContactFromRow(row: WarmContactRow): WarmContact {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    channel: undef(row.channel),
    url: undef(row.url),
    notes: undef(row.notes),
    lastTouchedAt: undef(row.last_touched_at),
    createdAt: row.created_at,
  };
}

export function warmContactToRow(c: WarmContact, userId: string): WarmContactRow {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    relationship: c.relationship,
    channel: nul(c.channel),
    url: nul(c.url),
    notes: nul(c.notes),
    last_touched_at: nul(c.lastTouchedAt),
    created_at: c.createdAt,
  };
}

// =============================================================================
// LINKEDIN POSTS
// =============================================================================

export function postFromRow(row: LinkedInPostRow): LinkedInPost {
  return {
    id: row.id,
    content: row.content,
    hook: row.hook ?? '',
    hashtags: row.hashtags ?? [],
    postType: row.post_type,
    icpTag: undef(row.icp_tag),
    estimatedReach: row.estimated_reach,
    bestTimeToPost: row.best_time_to_post ?? '',
    createdAt: row.created_at,
  };
}

export function postToRow(p: LinkedInPost, userId: string): LinkedInPostRow {
  return {
    id: p.id,
    user_id: userId,
    content: p.content,
    hook: nul(p.hook),
    hashtags: p.hashtags,
    post_type: p.postType,
    icp_tag: nul(p.icpTag),
    estimated_reach: p.estimatedReach,
    best_time_to_post: nul(p.bestTimeToPost),
    created_at: p.createdAt,
  };
}

// =============================================================================
// TWEETS
// =============================================================================

export function tweetFromRow(row: TweetRow): Tweet {
  return {
    id: row.id,
    content: row.content,
    hook: row.hook ?? '',
    postType: row.post_type,
    icpTag: undef(row.icp_tag),
    estimatedEngagement: row.estimated_engagement,
    createdAt: row.created_at,
  };
}

export function tweetToRow(t: Tweet, userId: string): TweetRow {
  return {
    id: t.id,
    user_id: userId,
    content: t.content,
    hook: nul(t.hook),
    post_type: t.postType,
    icp_tag: nul(t.icpTag),
    estimated_engagement: t.estimatedEngagement,
    created_at: t.createdAt,
  };
}

// =============================================================================
// TWITTER THREADS
// =============================================================================

export function threadFromRow(row: TwitterThreadRow): TwitterThread {
  return {
    id: row.id,
    hook: row.hook,
    setup: row.setup ?? [],
    insights: row.insights ?? [],
    cta: row.cta,
    threadType: row.thread_type,
    icpTag: undef(row.icp_tag),
    estimatedReach: row.estimated_reach,
    createdAt: row.created_at,
  };
}

export function threadToRow(t: TwitterThread, userId: string): TwitterThreadRow {
  return {
    id: t.id,
    user_id: userId,
    hook: t.hook,
    setup: t.setup,
    insights: t.insights,
    cta: t.cta,
    thread_type: t.threadType,
    icp_tag: nul(t.icpTag),
    estimated_reach: t.estimatedReach,
    created_at: t.createdAt,
  };
}
