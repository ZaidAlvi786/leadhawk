// This module exists because: bidirectional sync needs orchestration — pull
// from cloud, decide what wins on conflict, push local state back up. For
// Phase 8 the policy is intentionally simple:
//   - On PULL: cloud data overwrites local store (cloud is the truth)
//   - On PUSH: local state is upserted to cloud (id-keyed)
//   - On MIGRATE: same as PUSH but only fires when cloud is empty
// This isn't real-time sync — it's a manual button. The brief calls Phase 8
// "the final phase, do last because strategy beats infra." We ship the path
// and document the next step (write-through middleware) for follow-up work.

import { useStore } from '../store';
import { isPositioningComplete } from '../positioning';
import {
  positioningRepo, leadsRepo, signalsRepo, researchRepo,
  watchlistRepo, warmContactsRepo, postsRepo, tweetsRepo, threadsRepo,
} from './repos';

export interface SyncResult {
  ok: boolean;
  pushed: Record<string, number>;
  pulled: Record<string, number>;
  errors: { entity: string; error: string }[];
}

interface SyncInput {
  userId: string;
  direction: 'push' | 'pull';
}

/**
 * One-shot sync between local Zustand state and Supabase.
 * direction='push' uploads the local snapshot to cloud (idempotent — upserts by id).
 * direction='pull' fetches everything from cloud and hydrates the store.
 */
export async function runSync(input: SyncInput): Promise<SyncResult> {
  const result: SyncResult = { ok: true, pushed: {}, pulled: {}, errors: [] };

  if (input.direction === 'push') {
    await pushAll(input.userId, result);
  } else {
    await pullAll(input.userId, result);
  }

  result.ok = result.errors.length === 0;
  return result;
}

// -----------------------------------------------------------------------------
// PUSH — local → cloud
// -----------------------------------------------------------------------------

async function pushAll(userId: string, result: SyncResult): Promise<void> {
  const state = useStore.getState();

  // Each entity push is independent — one failure doesn't block the others.
  await runEntity('positioning', result, async () => {
    if (isPositioningComplete(state.userPositioning)) {
      await positioningRepo.save(state.userPositioning, userId);
      return 1;
    }
    return 0;
  });

  await runEntity('leads', result, async () => {
    await leadsRepo.upsertMany(state.pipelineLeads, userId);
    return state.pipelineLeads.length;
  });

  await runEntity('signals', result, async () => {
    await signalsRepo.upsertMany(state.intentSignals, userId);
    return state.intentSignals.length;
  });

  await runEntity('research', result, async () => {
    await researchRepo.upsertMany(state.leadResearch, userId);
    return state.leadResearch.length;
  });

  await runEntity('watchlist', result, async () => {
    await watchlistRepo.upsertMany(state.watchlistAccounts, userId);
    return state.watchlistAccounts.length;
  });

  await runEntity('warmContacts', result, async () => {
    await warmContactsRepo.upsertMany(state.warmContacts, userId);
    return state.warmContacts.length;
  });

  await runEntity('posts', result, async () => {
    await postsRepo.upsertMany(state.posts, userId);
    return state.posts.length;
  });

  await runEntity('tweets', result, async () => {
    await tweetsRepo.upsertMany(state.tweets, userId);
    return state.tweets.length;
  });

  await runEntity('threads', result, async () => {
    await threadsRepo.upsertMany(state.twitterThreads, userId);
    return state.twitterThreads.length;
  });
}

// -----------------------------------------------------------------------------
// PULL — cloud → local
// -----------------------------------------------------------------------------

async function pullAll(userId: string, result: SyncResult): Promise<void> {
  const store = useStore;

  await runEntity('positioning', result, async () => {
    const p = await positioningRepo.load(userId);
    if (p) {
      store.getState().setUserPositioning(p);
      return 1;
    }
    return 0;
  }, true);

  await runEntity('leads', result, async () => {
    const leads = await leadsRepo.list(userId);
    store.setState({ pipelineLeads: leads });
    return leads.length;
  }, true);

  await runEntity('signals', result, async () => {
    const signals = await signalsRepo.list(userId);
    store.setState({ intentSignals: signals });
    return signals.length;
  }, true);

  await runEntity('research', result, async () => {
    const r = await researchRepo.list(userId);
    store.setState({ leadResearch: r });
    return r.length;
  }, true);

  await runEntity('watchlist', result, async () => {
    const w = await watchlistRepo.list(userId);
    store.setState({ watchlistAccounts: w });
    return w.length;
  }, true);

  await runEntity('warmContacts', result, async () => {
    const c = await warmContactsRepo.list(userId);
    store.setState({ warmContacts: c });
    return c.length;
  }, true);

  await runEntity('posts', result, async () => {
    const p = await postsRepo.list(userId);
    store.setState({ posts: p });
    return p.length;
  }, true);

  await runEntity('tweets', result, async () => {
    const t = await tweetsRepo.list(userId);
    store.setState({ tweets: t });
    return t.length;
  }, true);

  await runEntity('threads', result, async () => {
    const t = await threadsRepo.list(userId);
    store.setState({ twitterThreads: t });
    return t.length;
  }, true);
}

// -----------------------------------------------------------------------------
// runEntity — one-entity wrapper that logs success or error without
// short-circuiting the rest of the sync.
// -----------------------------------------------------------------------------

async function runEntity(
  entity: string,
  result: SyncResult,
  fn: () => Promise<number>,
  isPull = false
): Promise<void> {
  try {
    const count = await fn();
    if (isPull) result.pulled[entity] = count;
    else result.pushed[entity] = count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push({ entity, error: msg });
  }
}

// -----------------------------------------------------------------------------
// migrateLocalToCloud — first-run migration. Only pushes when cloud appears
// empty (avoids overwriting cloud data with stale local data on first
// authenticated load from a new device).
// -----------------------------------------------------------------------------

export async function migrateLocalToCloud(userId: string): Promise<{ migrated: boolean; result: SyncResult | null; reason?: string }> {
  // Quick check: does the user have any leads already in the cloud?
  // If yes, we assume they've synced before — don't overwrite.
  const cloudLeads = await leadsRepo.list(userId).catch(() => null);
  if (cloudLeads === null) {
    return { migrated: false, result: null, reason: 'Could not read cloud (check tables exist + RLS policies)' };
  }
  if (cloudLeads.length > 0) {
    return { migrated: false, result: null, reason: `Cloud already has ${cloudLeads.length} lead(s) — skipping migration to avoid overwriting` };
  }

  const state = useStore.getState();
  const localCount = state.pipelineLeads.length + state.leadResearch.length + state.intentSignals.length;
  if (localCount === 0) {
    return { migrated: false, result: null, reason: 'Nothing in localStorage to migrate' };
  }

  const result = await runSync({ userId, direction: 'push' });
  return { migrated: true, result };
}
