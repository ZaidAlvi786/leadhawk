// This module exists because: every entity needs the same CRUD shape against
// Supabase (select * where user_id=? / upsert / delete). Centralizing the
// pattern means the SyncPanel and any future write-through middleware only
// learn one API. Each repo is a tiny wrapper around supabase-js — errors
// bubble up, mapping happens at the boundary.

import { supabase } from '../supabase';
import type {
  UserPositioning, PipelineLead, IntentSignal, LeadResearch,
  WatchlistAccount, WarmContact, LinkedInPost, Tweet, TwitterThread,
} from '../types';
import {
  positioningFromRow, positioningToRow,
  leadFromRow, leadToRow,
  signalFromRow, signalToRow,
  researchFromRow, researchToRow,
  watchlistFromRow, watchlistToRow,
  warmContactFromRow, warmContactToRow,
  postFromRow, postToRow,
  tweetFromRow, tweetToRow,
  threadFromRow, threadToRow,
} from './mappers';

// The exported `supabase` client is nullable (localStorage-only mode when env
// vars are missing). Repos are only meant to run when Supabase is configured,
// so we centralize the assertion here instead of branching at every callsite.
function db() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
      'or guard callers with isSupabaseEnabled() before invoking sync repos.'
    );
  }
  return supabase;
}

// -----------------------------------------------------------------------------
// User Positioning — singleton per user
// -----------------------------------------------------------------------------

export const positioningRepo = {
  async load(userId: string): Promise<UserPositioning | null> {
    const { data, error } = await db()
      .from('user_positioning')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? positioningFromRow(data) : null;
  },

  async save(p: UserPositioning, userId: string): Promise<void> {
    const row = { ...positioningToRow(p, userId), last_updated: new Date().toISOString() };
    const { error } = await db().from('user_positioning').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Pipeline Leads — list / upsert-many / delete
// -----------------------------------------------------------------------------

export const leadsRepo = {
  async list(userId: string): Promise<PipelineLead[]> {
    const { data, error } = await db()
      .from('pipeline_leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(leadFromRow);
  },

  async upsertMany(leads: PipelineLead[], userId: string): Promise<void> {
    if (leads.length === 0) return;
    const rows = leads.map((l) => leadToRow(l, userId));
    const { error } = await db().from('pipeline_leads').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async upsertOne(lead: PipelineLead, userId: string): Promise<void> {
    const { error } = await db().from('pipeline_leads').upsert(leadToRow(lead, userId), { onConflict: 'id' });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('pipeline_leads').delete().eq('id', id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Intent Signals
// -----------------------------------------------------------------------------

export const signalsRepo = {
  async list(userId: string): Promise<IntentSignal[]> {
    const { data, error } = await db()
      .from('intent_signals')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(signalFromRow);
  },

  async upsertMany(signals: IntentSignal[], userId: string): Promise<void> {
    if (signals.length === 0) return;
    const rows = signals.map((s) => signalToRow(s, userId));
    const { error } = await db().from('intent_signals').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('intent_signals').delete().eq('id', id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Lead Research
// -----------------------------------------------------------------------------

export const researchRepo = {
  async list(userId: string): Promise<LeadResearch[]> {
    const { data, error } = await db()
      .from('lead_research')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(researchFromRow);
  },

  async upsertMany(research: LeadResearch[], userId: string): Promise<void> {
    if (research.length === 0) return;
    const rows = research.map((r) => researchToRow(r, userId));
    const { error } = await db().from('lead_research').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('lead_research').delete().eq('id', id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Watchlist Accounts
// -----------------------------------------------------------------------------

export const watchlistRepo = {
  async list(userId: string): Promise<WatchlistAccount[]> {
    const { data, error } = await db()
      .from('watchlist_accounts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(watchlistFromRow);
  },

  async upsertMany(accounts: WatchlistAccount[], userId: string): Promise<void> {
    if (accounts.length === 0) return;
    const rows = accounts.map((a) => watchlistToRow(a, userId));
    const { error } = await db().from('watchlist_accounts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('watchlist_accounts').delete().eq('id', id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Warm Contacts
// -----------------------------------------------------------------------------

export const warmContactsRepo = {
  async list(userId: string): Promise<WarmContact[]> {
    const { data, error } = await db()
      .from('warm_contacts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(warmContactFromRow);
  },

  async upsertMany(contacts: WarmContact[], userId: string): Promise<void> {
    if (contacts.length === 0) return;
    const rows = contacts.map((c) => warmContactToRow(c, userId));
    const { error } = await db().from('warm_contacts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('warm_contacts').delete().eq('id', id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Posts / Tweets / Threads — content collections
// -----------------------------------------------------------------------------

export const postsRepo = {
  async list(userId: string): Promise<LinkedInPost[]> {
    const { data, error } = await db()
      .from('linkedin_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(postFromRow);
  },
  async upsertMany(posts: LinkedInPost[], userId: string): Promise<void> {
    if (posts.length === 0) return;
    const rows = posts.map((p) => postToRow(p, userId));
    const { error } = await db().from('linkedin_posts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await db().from('linkedin_posts').delete().eq('id', id);
    if (error) throw error;
  },
};

export const tweetsRepo = {
  async list(userId: string): Promise<Tweet[]> {
    const { data, error } = await db()
      .from('tweets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(tweetFromRow);
  },
  async upsertMany(tweets: Tweet[], userId: string): Promise<void> {
    if (tweets.length === 0) return;
    const rows = tweets.map((t) => tweetToRow(t, userId));
    const { error } = await db().from('tweets').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await db().from('tweets').delete().eq('id', id);
    if (error) throw error;
  },
};

export const threadsRepo = {
  async list(userId: string): Promise<TwitterThread[]> {
    const { data, error } = await db()
      .from('twitter_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(threadFromRow);
  },
  async upsertMany(threads: TwitterThread[], userId: string): Promise<void> {
    if (threads.length === 0) return;
    const rows = threads.map((t) => threadToRow(t, userId));
    const { error } = await db().from('twitter_threads').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await db().from('twitter_threads').delete().eq('id', id);
    if (error) throw error;
  },
};
