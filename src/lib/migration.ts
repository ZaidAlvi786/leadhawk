// This module exists because: when the user signs in for the first time
// after Phase 8, they may have months of localStorage data that nobody
// has ever pushed to Supabase. The migration runs ONCE per (user, browser):
//   1. Pull from Supabase. If the server has data → server wins, we're done.
//   2. If the server is empty AND localStorage has data → push everything.
//   3. Mark the migration as complete in localStorage so it never re-runs.
//
// "Server wins" is the safer default: if you've used the app on another
// device first, this device shouldn't overwrite your real data with stale
// localStorage. The opposite mistake (losing local data) is also avoided
// because we only push when the server has nothing.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from './store';
import { buildCollectionSpecs, pullAll, pushAll } from './sync';

const MIGRATION_DONE_KEY_PREFIX = 'leadhawk-migration-done-';

export function migrationDoneKey(userId: string): string {
  return `${MIGRATION_DONE_KEY_PREFIX}${userId}`;
}

export function isMigrationDone(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(migrationDoneKey(userId)) === 'true';
}

export function markMigrationDone(userId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(migrationDoneKey(userId), 'true');
}

/**
 * Read every persisted collection from the current Zustand state and report
 * how many items each contains. Used to decide whether to push or skip.
 */
export function localCounts(state: AppState): Record<string, number> {
  const specs = buildCollectionSpecs();
  const out: Record<string, number> = {};
  for (const [key, spec] of Object.entries(specs)) {
    const value = spec.read(state);
    if (spec.singleton) {
      out[key] = value && Object.keys(value as object).length > 0 ? 1 : 0;
    } else {
      out[key] = Array.isArray(value) ? value.length : 0;
    }
  }
  return out;
}

export interface MigrationResult {
  ran: boolean;                  // did the migration push anything?
  reason: 'server-has-data' | 'pushed' | 'no-local-data' | 'error' | 'already-done';
  pulled?: Record<string, number>;
  pushed?: Record<string, number>;
  errors?: Record<string, string>;
}

/**
 * The one-shot localStorage → Supabase migration. Idempotent.
 */
export async function runMigrationIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  state: AppState,
  setState: (partial: Partial<AppState>) => void,
): Promise<MigrationResult> {
  if (isMigrationDone(userId)) {
    // Even if migration is "done", we still want to hydrate from server
    // on every fresh load — that's the live-sync job, not the migration.
    return { ran: false, reason: 'already-done' };
  }

  // Step 1 — pull
  const pull = await pullAll(supabase, userId);
  if (Object.keys(pull.errors).length > 0) {
    return { ran: false, reason: 'error', errors: pull.errors };
  }

  // Did the server have anything?
  const serverHasData = Object.values(pull.loaded).some((arr) => arr.length > 0);

  if (serverHasData) {
    // Server wins — hydrate the store from server data and skip the push.
    const specs = buildCollectionSpecs();
    for (const [key, spec] of Object.entries(specs)) {
      const items = pull.loaded[key] ?? [];
      if (spec.singleton) {
        if (items.length > 0) spec.write(setState, items[0]);
      } else {
        spec.write(setState, items);
      }
    }
    markMigrationDone(userId);
    const pulledCounts: Record<string, number> = {};
    Object.entries(pull.loaded).forEach(([k, v]) => { pulledCounts[k] = v.length; });
    return { ran: false, reason: 'server-has-data', pulled: pulledCounts };
  }

  // Step 2 — server is empty. Does localStorage have anything?
  const counts = localCounts(state);
  const hasLocalData = Object.values(counts).some((n) => n > 0);
  if (!hasLocalData) {
    markMigrationDone(userId);
    return { ran: false, reason: 'no-local-data' };
  }

  // Step 3 — push everything.
  const push = await pushAll(supabase, userId, state);
  if (Object.keys(push.errors).length > 0) {
    // Don't mark done if any errors — let the user retry on next load.
    return { ran: true, reason: 'error', pushed: push.pushed, errors: push.errors };
  }

  markMigrationDone(userId);
  return { ran: true, reason: 'pushed', pushed: push.pushed };
}
