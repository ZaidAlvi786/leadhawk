// This module exists because: the app needs to work both with Supabase
// configured (cloud sync, multi-device, RLS-secured) and without it
// (localStorage-only, single-device — Phases 1-7's default behaviour).
// Throwing on missing env vars (the original behaviour) broke the whole
// app for anyone who hadn't provisioned Supabase yet. This module returns
// `null` instead and lets every caller branch on `isSupabaseEnabled`.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The shared Supabase client, or null when env vars are missing. Always
 * check `isSupabaseEnabled()` before calling methods on this — null means
 * the app falls back to localStorage-only mode.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

/**
 * True when Supabase env vars are present. Use this for flow control —
 * components/sync code should branch on this instead of trying to handle
 * the null case at every callsite.
 */
export function isSupabaseEnabled(): boolean {
  return supabase !== null;
}

if (typeof window !== 'undefined' && !supabase) {
  // eslint-disable-next-line no-console
  console.info(
    '[LeadHawk] Supabase not configured — running in localStorage-only mode. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable cloud sync. ' +
    'See SUPABASE_SETUP.md for setup steps.'
  );
}
