// This module exists because: Supabase tables use snake_case columns, the
// app uses camelCase fields. Defining the row types here once means the
// repos and the mappers have a single contract — no magic strings drifting
// between layers.

import type {
  UserPositioning, PipelineLead, IntentSignal, LeadResearch,
  WatchlistAccount, WarmContact, LinkedInPost, Tweet, TwitterThread,
  ProofAsset, StageTransition, LeadResearchSource, LeadResearchHook,
  DiscoveryBrief, CallDebrief, Proposal, LeadArchetype, IntentSignalType,
  LeadSource, PipelineStage, LinkedInPostType,
} from '../types';

// =============================================================================
// USER POSITIONING
// =============================================================================

export interface UserPositioningRow {
  user_id: string;
  target_role: string;
  target_company_type: string;
  painful_problem: string;
  mechanism: string;
  outcome_metric: string;
  outcome_timeframe: string;
  outcome_is_projected: boolean;
  proof_assets: ProofAsset[];
  not_for: string;
  version: number;
  last_updated: string;
}

// =============================================================================
// PIPELINE LEADS
// =============================================================================

export interface PipelineLeadRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  company: string;
  email: string | null;
  industry: string | null;
  source: LeadSource;
  stage: PipelineStage;
  notes: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  sequence_id: string | null;
  current_step: number | null;
  ai_suggested_action: string | null;
  icp_tag: string | null;
  proposal_amount: number | null;
  deal_amount: number | null;
  stage_history: StageTransition[];
  discovery_brief: DiscoveryBrief | null;
  call_debrief: CallDebrief | null;
  proposal: Proposal | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INTENT SIGNALS
// =============================================================================

export interface IntentSignalRow {
  id: string;
  user_id: string;
  lead_id: string | null;
  watchlist_account_id: string | null;
  type: IntentSignalType;
  title: string;
  content: string | null;
  url: string | null;
  occurred_at: string;
  captured_at: string;
}

// =============================================================================
// LEAD RESEARCH
// =============================================================================

export interface LeadResearchRow {
  id: string;
  user_id: string;
  lead_name: string;
  lead_company: string | null;
  lead_role: string | null;
  linkedin_url: string | null;
  archetype: LeadArchetype;
  sources: LeadResearchSource[];
  summary: string | null;
  hooks: LeadResearchHook[];
  best_approach: string | null;
  red_flags: string[];
  synthesized_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// WATCHLIST ACCOUNTS
// =============================================================================

export interface WatchlistAccountRow {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  url: string | null;
  notes: string | null;
  last_checked_at: string | null;
  created_at: string;
}

// =============================================================================
// WARM CONTACTS
// =============================================================================

export interface WarmContactRow {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  channel: string | null;
  url: string | null;
  notes: string | null;
  last_touched_at: string | null;
  created_at: string;
}

// =============================================================================
// LINKEDIN POSTS
// =============================================================================

export interface LinkedInPostRow {
  id: string;
  user_id: string;
  content: string;
  hook: string | null;
  hashtags: string[];
  post_type: LinkedInPostType;
  icp_tag: string | null;
  estimated_reach: number;
  best_time_to_post: string | null;
  created_at: string;
}

// =============================================================================
// TWEETS
// =============================================================================

export interface TweetRow {
  id: string;
  user_id: string;
  content: string;
  hook: string | null;
  post_type: 'single' | 'thread-part' | 'reply';
  icp_tag: string | null;
  estimated_engagement: number;
  created_at: string;
}

// =============================================================================
// TWITTER THREADS
// =============================================================================

export interface TwitterThreadRow {
  id: string;
  user_id: string;
  hook: string;
  setup: string[];
  insights: string[];
  cta: string;
  thread_type: 'educational' | 'story' | 'tips' | 'debate' | 'thread';
  icp_tag: string | null;
  estimated_reach: number;
  created_at: string;
}

// Re-export the app types so consumers only import from rowTypes when mixing
export type {
  UserPositioning, PipelineLead, IntentSignal, LeadResearch,
  WatchlistAccount, WarmContact, LinkedInPost, Tweet, TwitterThread,
};
