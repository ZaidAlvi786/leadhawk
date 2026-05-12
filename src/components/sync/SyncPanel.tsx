// This component exists because: Phase 8's migration is a manual,
// user-triggered operation — not background magic. The user pushes to
// cloud when they want multi-device sync, pulls when they sit down at a
// fresh browser. The panel is also the diagnostic surface — when sync
// fails (RLS misconfig, missing tables, network), it's where the user
// reads the error.

import React, { useState } from 'react';
import { Cloud, CloudOff, Upload, Download, Check, AlertTriangle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { runSync, migrateLocalToCloud, type SyncResult } from '@/lib/sync/syncService';

export default function SyncPanel() {
  const { user, session } = useAuth();
  const [busy, setBusy] = useState<'push' | 'pull' | 'migrate' | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('leadhawk-last-sync-at') : null
  );

  const userId = user?.id;
  const authed = !!session && !!userId;

  const recordSync = (result: SyncResult) => {
    setLastResult(result);
    if (result.ok) {
      const now = new Date().toISOString();
      setLastSyncAt(now);
      if (typeof window !== 'undefined') localStorage.setItem('leadhawk-last-sync-at', now);
    }
  };

  const handlePush = async () => {
    if (!userId) return;
    setBusy('push');
    try {
      const result = await runSync({ userId, direction: 'push' });
      recordSync(result);
      toast.success(result.ok
        ? `Pushed ${summarize(result.pushed)} to cloud`
        : `Pushed with ${result.errors.length} error(s) — see details`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setBusy(null);
    }
  };

  const handlePull = async () => {
    if (!userId) return;
    if (!confirm('Pull will OVERWRITE your local state with the cloud copy. Continue?')) return;
    setBusy('pull');
    try {
      const result = await runSync({ userId, direction: 'pull' });
      recordSync(result);
      toast.success(result.ok
        ? `Pulled ${summarize(result.pulled)} from cloud`
        : `Pulled with ${result.errors.length} error(s) — see details`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setBusy(null);
    }
  };

  const handleMigrate = async () => {
    if (!userId) return;
    setBusy('migrate');
    try {
      const out = await migrateLocalToCloud(userId);
      if (!out.migrated) {
        toast(out.reason || 'Migration skipped', { icon: 'ℹ️' });
      } else if (out.result) {
        recordSync(out.result);
        toast.success(`First-time migration: pushed ${summarize(out.result.pushed)}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setBusy(null);
    }
  };

  if (!authed) {
    return (
      <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'rgba(208,138,62,0.25)' }}>
        <CloudOff size={16} color="#D08A3E" />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#D08A3E', fontFamily: 'Syne' }}>
            Not signed in
          </p>
          <p className="text-xs" style={{ color: '#6E7F86' }}>
            Sign in to push your local data to cloud. Until then, everything stays in this browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Cloud size={14} color="#1E6F70" />
        <h3 className="text-sm font-semibold" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>
          Sync · {user?.email}
        </h3>
        {lastSyncAt && (
          <span className="text-xs ml-auto" style={{ color: '#6E7F86' }}>
            Last synced {formatLastSync(lastSyncAt)}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#6E7F86' }}>
        Phase 8 migration is manual on purpose. <strong style={{ color: 'var(--text-primary)' }}>Push</strong> uploads your local data to cloud (safe to run anytime — uses upsert).
        {' '}<strong style={{ color: 'var(--text-primary)' }}>Pull</strong> replaces your local state with the cloud copy (use on a fresh device).
      </p>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <SyncButton
          icon={<Upload size={12} />}
          label="Push to cloud"
          sublabel="Upload local state"
          loading={busy === 'push'}
          disabled={!!busy}
          onClick={handlePush}
          color="#1E6F70"
        />
        <SyncButton
          icon={<Download size={12} />}
          label="Pull from cloud"
          sublabel="Overwrite local"
          loading={busy === 'pull'}
          disabled={!!busy}
          onClick={handlePull}
          color="#1E6F70"
        />
        <SyncButton
          icon={<Cloud size={12} />}
          label="First-time migrate"
          sublabel="Push only if cloud empty"
          loading={busy === 'migrate'}
          disabled={!!busy}
          onClick={handleMigrate}
          color="#CC6B4F"
        />
      </div>

      {/* Result summary */}
      {lastResult && (
        <div className="rounded-lg p-3" style={{
          background: lastResult.ok ? 'rgba(30,111,112,0.05)' : 'rgba(208,138,62,0.05)',
          border: `1px solid ${lastResult.ok ? 'rgba(30,111,112,0.18)' : 'rgba(208,138,62,0.22)'}`,
        }}>
          <div className="flex items-center gap-2 mb-2">
            {lastResult.ok
              ? <Check size={12} color="#1E6F70" />
              : <AlertTriangle size={12} color="#D08A3E" />}
            <span className="text-xs font-semibold" style={{
              color: lastResult.ok ? '#1E6F70' : '#D08A3E',
              fontFamily: 'Syne',
            }}>
              {lastResult.ok ? 'Sync complete' : `Sync had ${lastResult.errors.length} error(s)`}
            </span>
          </div>
          {Object.entries(lastResult.pushed).length > 0 && (
            <p className="text-xs mb-1" style={{ color: '#6E7F86' }}>
              <strong>Pushed:</strong> {Object.entries(lastResult.pushed).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(', ') || '—'}
            </p>
          )}
          {Object.entries(lastResult.pulled).length > 0 && (
            <p className="text-xs mb-1" style={{ color: '#6E7F86' }}>
              <strong>Pulled:</strong> {Object.entries(lastResult.pulled).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(', ') || '—'}
            </p>
          )}
          {lastResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {lastResult.errors.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: '#fca5a5' }}>
                  <strong>{e.entity}:</strong> {e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Setup hint */}
      <details className="text-xs" style={{ color: '#6E7F86' }}>
        <summary className="cursor-pointer" style={{ color: '#6E7F86' }}>Setup checklist</summary>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code></li>
          <li>Run <code>supabase/migrations/001_initial_schema.sql</code> in the Supabase SQL editor</li>
          <li>Confirm RLS policies show in Supabase dashboard (Policies tab on every table)</li>
          <li>Click "First-time migrate" above</li>
        </ol>
      </details>
    </div>
  );
}

function SyncButton({ icon, label, sublabel, loading, disabled, onClick, color }: {
  icon: React.ReactNode; label: string; sublabel: string; loading: boolean; disabled: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-3 rounded-lg text-left transition-all disabled:opacity-50"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}33`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {loading
          ? <Loader size={12} color={color} className="animate-spin" />
          : <span style={{ color }}>{icon}</span>}
        <span className="text-xs font-semibold" style={{ color, fontFamily: 'Syne' }}>{label}</span>
      </div>
      <p className="text-xs" style={{ color: '#6E7F86' }}>{sublabel}</p>
    </button>
  );
}

function summarize(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return `${total} record${total === 1 ? '' : 's'}`;
}

function formatLastSync(stamp: string): string {
  const ts = new Date(stamp).getTime();
  if (isNaN(ts)) return 'never';
  const hours = (Date.now() - ts) / 3_600_000;
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
