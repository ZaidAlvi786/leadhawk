// This module exists because: the brief's Phase 8 is to migrate off
// localStorage to Supabase WITHOUT losing the localStorage layer's
// offline-first benefits. Strategy:
//   * Writes go to Zustand (and via persist to localStorage) immediately.
//   * Each persisted collection has a debounced sync job that pushes
//     changes to Supabase when auth is present.
//   * On first authenticated load: pull all rows from Supabase. If the
//     server has nothing AND localStorage has data, push the local data
//     to the server (one-shot migration). Otherwise server wins.
//   * Conflict policy: latest `updatedAt` (or row timestamp) wins.
//
// All of this is no-op when Supabase isn't configured — single-device
// users keep working as before.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from './store';

// -----------------------------------------------------------------------------
// Table catalogue — each entry maps a Zustand store collection to a Supabase
// table. The accessor returns the array (or single object); the writer takes
// the loaded rows and merges them back into state.
// -----------------------------------------------------------------------------

export interface CollectionSpec<T> {
  table: string;
  /** Whether the collection is 1:1 with the user (true) or 1:many (false). */
  singleton: boolean;
  /** Pull the data out of the Zustand state. */
  read(state: AppState): T;
  /** Replace the data in the Zustand store with the given value (from server). */
  write(setState: (partial: Partial<AppState>) => void, value: T): void;
  /** For 1:many collections — extract the client-generated id from one item. */
  itemId?(item: unknown): string;
}

/** All persisted collections, paired with their Supabase tables. */
export function buildCollectionSpecs(): Record<string, CollectionSpec<unknown>> {
  return {
    userPositioning: {
      table: 'user_positioning',
      singleton: true,
      read: (s) => s.userPositioning,
      write: (set, v) => set({ userPositioning: v as AppState['userPositioning'] }),
    },
    userProfile: {
      table: 'user_profile',
      singleton: true,
      read: (s) => s.userProfile,
      write: (set, v) => set({ userProfile: v as AppState['userProfile'] }),
    },
    pipelineLeads: {
      table: 'pipeline_leads',
      singleton: false,
      read: (s) => s.pipelineLeads,
      write: (set, v) => set({ pipelineLeads: v as AppState['pipelineLeads'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    leadResearch: {
      table: 'lead_research',
      singleton: false,
      read: (s) => s.leadResearch,
      write: (set, v) => set({ leadResearch: v as AppState['leadResearch'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    intentSignals: {
      table: 'intent_signals',
      singleton: false,
      read: (s) => s.intentSignals,
      write: (set, v) => set({ intentSignals: v as AppState['intentSignals'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    watchlistAccounts: {
      table: 'watchlist_accounts',
      singleton: false,
      read: (s) => s.watchlistAccounts,
      write: (set, v) => set({ watchlistAccounts: v as AppState['watchlistAccounts'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    warmContacts: {
      table: 'warm_contacts',
      singleton: false,
      read: (s) => s.warmContacts,
      write: (set, v) => set({ warmContacts: v as AppState['warmContacts'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    filters: {
      table: 'lead_filters',
      singleton: false,
      read: (s) => s.filters,
      write: (set, v) => set({ filters: v as AppState['filters'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    posts: {
      table: 'posts',
      singleton: false,
      read: (s) => s.posts,
      write: (set, v) => set({ posts: v as AppState['posts'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    tweets: {
      table: 'tweets',
      singleton: false,
      read: (s) => s.tweets,
      write: (set, v) => set({ tweets: v as AppState['tweets'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    twitterThreads: {
      table: 'twitter_threads',
      singleton: false,
      read: (s) => s.twitterThreads,
      write: (set, v) => set({ twitterThreads: v as AppState['twitterThreads'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    sequences: {
      table: 'sequences',
      singleton: false,
      read: (s) => s.sequences,
      write: (set, v) => set({ sequences: v as AppState['sequences'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    growthPlans: {
      table: 'growth_plans',
      singleton: false,
      read: (s) => s.growthPlans,
      write: (set, v) => set({ growthPlans: v as AppState['growthPlans'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    twitterGrowthPlans: {
      table: 'twitter_growth_plans',
      singleton: false,
      read: (s) => s.twitterGrowthPlans,
      write: (set, v) => set({ twitterGrowthPlans: v as AppState['twitterGrowthPlans'] }),
      itemId: (i) => (i as { id: string }).id,
    },
    outcomes: {
      table: 'message_outcomes',
      singleton: false,
      read: (s) => s.outcomes,
      write: (set, v) => set({ outcomes: v as AppState['outcomes'] }),
      itemId: (i) => (i as { id: string }).id,
    },
  };
}

// -----------------------------------------------------------------------------
// Pull from server: load every collection's rows for the current user.
// -----------------------------------------------------------------------------

export interface PullResult {
  /** Map of collection key → array of items pulled (or singleton wrapped in a 1-element array). */
  loaded: Record<string, unknown[]>;
  /** Errors keyed by collection name (most ops can degrade independently). */
  errors: Record<string, string>;
}

export async function pullAll(supabase: SupabaseClient, userId: string): Promise<PullResult> {
  const specs = buildCollectionSpecs();
  const loaded: Record<string, unknown[]> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    Object.entries(specs).map(async ([key, spec]) => {
      try {
        const { data, error } = await supabase
          .from(spec.table)
          .select('data')
          .eq('user_id', userId);
        if (error) {
          errors[key] = error.message;
          return;
        }
        loaded[key] = (data ?? []).map((row: { data: unknown }) => row.data);
      } catch (err) {
        errors[key] = err instanceof Error ? err.message : String(err);
      }
    })
  );

  return { loaded, errors };
}

// -----------------------------------------------------------------------------
// Push to server: upsert every item from the local state.
// -----------------------------------------------------------------------------

export interface PushReport {
  pushed: Record<string, number>;     // count per collection
  errors: Record<string, string>;
}

export async function pushAll(
  supabase: SupabaseClient,
  userId: string,
  state: AppState,
): Promise<PushReport> {
  const specs = buildCollectionSpecs();
  const pushed: Record<string, number> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    Object.entries(specs).map(async ([key, spec]) => {
      try {
        const value = spec.read(state);

        if (spec.singleton) {
          // Skip if the singleton looks empty — avoids pushing emptyPositioning()
          if (!value || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
            pushed[key] = 0;
            return;
          }
          const { error } = await supabase
            .from(spec.table)
            .upsert({ user_id: userId, data: value }, { onConflict: 'user_id' });
          if (error) errors[key] = error.message;
          else pushed[key] = 1;
          return;
        }

        const items = value as unknown[];
        if (!Array.isArray(items) || items.length === 0) {
          pushed[key] = 0;
          return;
        }
        const rows = items.map((item) => ({
          user_id: userId,
          item_id: spec.itemId!(item),
          data: item,
        }));
        const { error } = await supabase
          .from(spec.table)
          .upsert(rows, { onConflict: 'user_id,item_id' });
        if (error) errors[key] = error.message;
        else pushed[key] = items.length;
      } catch (err) {
        errors[key] = err instanceof Error ? err.message : String(err);
      }
    })
  );

  return { pushed, errors };
}

// -----------------------------------------------------------------------------
// Push a single change. Used by the live-sync subscription so that every
// Zustand write immediately mirrors to Supabase (debounced upstream).
// -----------------------------------------------------------------------------

export async function pushOne(
  supabase: SupabaseClient,
  userId: string,
  collectionKey: string,
  state: AppState,
): Promise<{ ok: boolean; reason?: string }> {
  const spec = buildCollectionSpecs()[collectionKey];
  if (!spec) return { ok: false, reason: `Unknown collection ${collectionKey}` };
  try {
    const value = spec.read(state);
    if (spec.singleton) {
      const { error } = await supabase
        .from(spec.table)
        .upsert({ user_id: userId, data: value }, { onConflict: 'user_id' });
      return error ? { ok: false, reason: error.message } : { ok: true };
    }
    const items = value as unknown[];
    if (!Array.isArray(items)) return { ok: false, reason: 'Expected array' };
    if (items.length === 0) return { ok: true };
    const rows = items.map((item) => ({
      user_id: userId,
      item_id: spec.itemId!(item),
      data: item,
    }));
    const { error } = await supabase
      .from(spec.table)
      .upsert(rows, { onConflict: 'user_id,item_id' });
    return error ? { ok: false, reason: error.message } : { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// -----------------------------------------------------------------------------
// Sync state — what the UI binds to.
// -----------------------------------------------------------------------------

export type SyncStatus =
  | 'disabled'    // Supabase env vars not set
  | 'unauth'      // Supabase configured but user not signed in
  | 'idle'        // synced, nothing pending
  | 'syncing'     // a push or pull is in flight
  | 'error';      // most-recent op failed (kept for surfacing in UI)

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
}
