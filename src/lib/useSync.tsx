// This hook exists because: Phase 8's contract is "writes go to localStorage
// immediately (no data loss) AND replicate to Supabase asynchronously
// (multi-device, server-of-truth)". This hook owns:
//   * Running the one-shot migration on first authenticated load.
//   * Subscribing to Zustand changes and debouncing pushes per collection.
//   * Surfacing a SyncState that the SyncStatusIndicator binds to.
// All of it is no-op when Supabase isn't enabled.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, type AppState } from './store';
import { useAuth } from './auth';
import { supabase, isSupabaseEnabled } from './supabase';
import { runMigrationIfNeeded } from './migration';
import { buildCollectionSpecs, pushOne, type SyncState } from './sync';

const PUSH_DEBOUNCE_MS = 1500;

export function useSync(): { state: SyncState; retry: () => void } {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  const [state, setState] = useState<SyncState>(() => ({
    status: !isSupabaseEnabled() ? 'disabled' : 'unauth',
    lastSyncedAt: null,
    lastError: null,
  }));

  // Per-collection last-known fingerprint, so we only push when content actually changed.
  const lastFingerprints = useRef<Record<string, string>>({});
  // Per-collection debounce timers.
  const pushTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // -------------------------------------------------------------------------
  // 1. On (re)auth: run the migration, then set status to 'idle'.
  // -------------------------------------------------------------------------

  const runMigration = useCallback(async () => {
    if (!supabase || !userId) return;
    setState((s) => ({ ...s, status: 'syncing', lastError: null }));
    const result = await runMigrationIfNeeded(
      supabase,
      userId,
      useStore.getState(),
      (partial) => useStore.setState(partial as Partial<AppState>),
    );
    if (result.reason === 'error') {
      setState({
        status: 'error',
        lastSyncedAt: null,
        lastError: Object.values(result.errors ?? { _: 'Unknown' })[0] ?? 'Sync error',
      });
    } else {
      setState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
      // Reset fingerprints to current values so we don't re-push on first idle.
      const specs = buildCollectionSpecs();
      const state = useStore.getState();
      const fp: Record<string, string> = {};
      for (const [key, spec] of Object.entries(specs)) {
        fp[key] = JSON.stringify(spec.read(state));
      }
      lastFingerprints.current = fp;
    }
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    if (!isSupabaseEnabled()) {
      setState({ status: 'disabled', lastSyncedAt: null, lastError: null });
      return;
    }
    if (!userId) {
      setState({ status: 'unauth', lastSyncedAt: null, lastError: null });
      return;
    }
    void runMigration();
  }, [userId, loading, runMigration]);

  // -------------------------------------------------------------------------
  // 2. Live sync: subscribe to Zustand updates, debounce per collection,
  //    push only when fingerprint changed.
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!supabase || !userId || !isSupabaseEnabled()) return;
    const specs = buildCollectionSpecs();

    const unsubscribe = useStore.subscribe((state) => {
      for (const [key, spec] of Object.entries(specs)) {
        const value = spec.read(state);
        const fp = JSON.stringify(value);
        if (fp === lastFingerprints.current[key]) continue;
        lastFingerprints.current[key] = fp;

        // Debounce per-collection pushes — typing in a notes field
        // shouldn't fire 30 upserts a minute.
        if (pushTimers.current[key]) clearTimeout(pushTimers.current[key]);
        pushTimers.current[key] = setTimeout(async () => {
          if (!supabase || !userId) return;
          setState((s) => (s.status === 'idle' ? { ...s, status: 'syncing' } : s));
          const result = await pushOne(supabase, userId, key, useStore.getState());
          if (!result.ok) {
            setState({ status: 'error', lastSyncedAt: null, lastError: result.reason ?? 'Push failed' });
          } else {
            setState({ status: 'idle', lastSyncedAt: new Date().toISOString(), lastError: null });
          }
        }, PUSH_DEBOUNCE_MS);
      }
    });

    return () => {
      unsubscribe();
      Object.values(pushTimers.current).forEach((t) => clearTimeout(t));
      pushTimers.current = {};
    };
  }, [userId]);

  return { state, retry: runMigration };
}
