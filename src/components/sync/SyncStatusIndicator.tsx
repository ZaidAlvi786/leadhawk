// This component exists because: when Supabase is configured, the user
// needs to know at a glance whether their data is synced. Bottom of the
// sidebar. Tiny — just a colored dot + "Synced" / "Syncing…" / "Offline"
// / "Error" — and a tooltip with details. When Supabase isn't configured,
// the indicator says "Local only" so the user knows what mode they're in.

import React from 'react';
import { Cloud, CloudOff, AlertCircle, RefreshCw, HardDrive } from 'lucide-react';
import type { SyncState } from '@/lib/sync';

interface Props {
  state: SyncState;
  /** Optional onClick to retry a failed sync. */
  onRetry?: () => void;
}

export default function SyncStatusIndicator({ state, onRetry }: Props) {
  const meta = META[state.status];
  const Icon = meta.icon;
  const tooltip =
    state.status === 'error' && state.lastError
      ? `Last error: ${state.lastError}`
      : state.lastSyncedAt
        ? `Last synced ${formatStamp(state.lastSyncedAt)}`
        : meta.subtitle;

  return (
    <button
      type="button"
      onClick={state.status === 'error' && onRetry ? onRetry : undefined}
      title={tooltip}
      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        cursor: state.status === 'error' && onRetry ? 'pointer' : 'default',
      }}
    >
      <Icon size={11} color={meta.color} className={state.status === 'syncing' ? 'animate-spin' : ''} />
      <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
      <span className="text-xs ml-auto" style={{ color: '#6E7F86' }}>
        {state.lastSyncedAt ? formatStampShort(state.lastSyncedAt) : ''}
      </span>
    </button>
  );
}

const META = {
  disabled: { label: 'Local only',   subtitle: 'Supabase not configured', color: '#6E7F86', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', icon: HardDrive },
  unauth:   { label: 'Sign in to sync', subtitle: 'Auth required',         color: '#6E7F86', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', icon: CloudOff },
  idle:     { label: 'Synced',       subtitle: 'All data backed up',      color: '#1E6F70', bg: 'rgba(30,111,112,0.06)', border: 'rgba(30,111,112,0.18)', icon: Cloud },
  syncing:  { label: 'Syncing…',     subtitle: 'Pushing changes',         color: '#1E6F70', bg: 'rgba(58,143,163,0.06)', border: 'rgba(58,143,163,0.18)', icon: RefreshCw },
  error:    { label: 'Sync error',   subtitle: 'Click to retry',          color: '#B0432A', bg: 'rgba(176,67,42,0.06)',  border: 'rgba(176,67,42,0.22)',  icon: AlertCircle },
} as const;

function formatStamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function formatStampShort(iso: string): string {
  try {
    const d = new Date(iso);
    const minutes = Math.floor((Date.now() - d.getTime()) / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / (60 * 24))}d ago`;
  } catch {
    return '';
  }
}
