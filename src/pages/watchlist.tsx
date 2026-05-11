// This page exists because: top operators check 20-50 target accounts every
// day, scanning for fresh signals. Beginners hope leads will appear. The
// watchlist is intentionally manual — pasting signals you found is the
// discipline; no automation can replace that habit.

import React, { useState } from 'react';
import {
  Plus, Eye, Trash2, ExternalLink, Calendar, ChevronDown, ChevronUp, AlertCircle, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { signalsForWatchlist, freshestSignal, freshnessHours, classifyFreshness, formatFreshness } from '@/lib/intent';
import IntentSignalDisplay from '@/components/intent/IntentSignalDisplay';
import IntentSignalEditor from '@/components/intent/IntentSignalEditor';
import type { WatchlistAccount } from '@/lib/types';

const MAX_ACCOUNTS = 50;

export default function WatchlistPage() {
  const {
    watchlistAccounts, addWatchlistAccount, deleteWatchlistAccount,
    markWatchlistChecked, intentSignals, deleteIntentSignal,
  } = useStore();
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draft, setDraft] = useState({ companyName: '', industry: '', url: '', notes: '' });

  const now = new Date();

  // Compute "stale" accounts — not checked in over 24h, no recent signal
  const staleAccounts = watchlistAccounts.filter((a) => {
    if (!a.lastCheckedAt) return true;
    const hoursSinceChecked = (now.getTime() - new Date(a.lastCheckedAt).getTime()) / 3_600_000;
    return hoursSinceChecked > 24;
  });

  const handleAdd = () => {
    if (!draft.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (watchlistAccounts.length >= MAX_ACCOUNTS) {
      toast.error(`Watchlist caps at ${MAX_ACCOUNTS} — fewer accounts checked daily beats more accounts ignored.`);
      return;
    }
    addWatchlistAccount({
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      companyName: draft.companyName.trim(),
      industry: draft.industry.trim() || undefined,
      url: draft.url.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setDraft({ companyName: '', industry: '', url: '', notes: '' });
    setAdding(false);
    toast.success('Added to watchlist');
  };

  const handleDelete = (account: WatchlistAccount) => {
    if (!confirm(`Remove ${account.companyName} and all attached signals from your watchlist?`)) return;
    deleteWatchlistAccount(account.id);
    toast.success('Removed');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D08A3E, #B0432A)' }}>
            <Eye size={13} color="white" />
          </div>
          <span className="text-xs font-medium tag tag-amber">Daily discipline</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
          Watchlist
        </h2>
        <p className="text-sm" style={{ color: '#6E7F86' }}>
          {watchlistAccounts.length} of {MAX_ACCOUNTS} target accounts. Check daily. Paste any new signal you find.
        </p>
      </div>

      {/* Daily nudge */}
      {staleAccounts.length > 0 && (
        <div className="px-4 md:px-8 py-3 border-b" style={{
          background: 'rgba(208,138,62,0.06)',
          borderColor: 'rgba(208,138,62,0.2)',
        }}>
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle size={13} color="#D08A3E" />
            <span style={{ color: '#D08A3E' }}>
              <strong>{staleAccounts.length}</strong> account{staleAccounts.length === 1 ? '' : 's'} not checked today.
              Spend 15 minutes scanning their LinkedIn, Twitter, and recent news. Paste anything you find.
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 md:px-8 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'rgba(58,143,163,0.08)' }}>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setAdding(!adding)}
          disabled={watchlistAccounts.length >= MAX_ACCOUNTS}
        >
          <Plus size={14} />
          Add Account
        </button>
        <span className="text-xs" style={{ color: '#6E7F86' }}>
          {intentSignals.filter((s) => s.watchlistAccountId).length} signals tracked
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-3">
        {/* Add form */}
        {adding && (
          <div className="glass-card p-4" style={{ border: '1px solid rgba(58,143,163,0.25)' }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>
              Add Target Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                className="input-field text-sm"
                placeholder="Company name *"
                value={draft.companyName}
                onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
              />
              <input
                className="input-field text-sm"
                placeholder="Industry"
                value={draft.industry}
                onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
              />
              <input
                className="input-field text-sm md:col-span-2"
                placeholder="LinkedIn / homepage URL"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
              <textarea
                className="input-field text-sm md:col-span-2 resize-none"
                rows={2}
                placeholder="Why this account? (e.g. 'just raised Series A — likely hiring senior engineers soon')"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="btn-primary text-sm">Add to Watchlist</button>
              <button onClick={() => setAdding(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {watchlistAccounts.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
              background: 'rgba(208,138,62,0.1)',
              border: '1px solid rgba(208,138,62,0.2)',
            }}>
              <Eye size={28} color="#D08A3E" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Syne' }}>
              Your watchlist is empty
            </h3>
            <p className="text-sm text-center max-w-md" style={{ color: '#6E7F86' }}>
              Add 20–50 accounts that match your positioning. Check them daily for signals.
              The discipline of <em>looking</em> beats hoping for inbound.
            </p>
          </div>
        )}

        {/* Account list — sorted by freshest signal first, then alphabetical */}
        {watchlistAccounts
          .map((a) => {
            const signals = signalsForWatchlist(intentSignals, a.id);
            const top = freshestSignal(signals);
            const hours = top ? freshnessHours(top) : Infinity;
            return { account: a, signals, top, hours };
          })
          .sort((a, b) => a.hours - b.hours)
          .map(({ account, signals, top, hours }) => {
            const freshness = top ? classifyFreshness(hours) : 'cold';
            const isHot = freshness === 'hot';
            const isStale = !top || freshness === 'cold';
            const isExpanded = expanded === account.id;
            const checkedHoursAgo = account.lastCheckedAt
              ? (now.getTime() - new Date(account.lastCheckedAt).getTime()) / 3_600_000
              : null;

            return (
              <div
                key={account.id}
                className="glass-card p-4"
                style={{
                  border: isHot ? '1px solid rgba(208,138,62,0.55)' : '1px solid rgba(255,255,255,0.06)',
                  opacity: isStale ? 0.7 : 1,
                  boxShadow: isHot ? '0 0 24px rgba(208,138,62,0.18)' : 'none',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: isHot ? 'rgba(208,138,62,0.18)' : 'rgba(58,143,163,0.1)',
                  }}>
                    <Building2 size={15} color={isHot ? '#D08A3E' : '#1E6F70'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{account.companyName}</span>
                      {account.industry && (
                        <span className="tag tag-indigo text-xs">{account.industry}</span>
                      )}
                      {account.url && (
                        <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: '#6E7F86' }}>
                          <ExternalLink size={10} />
                          link
                        </a>
                      )}
                    </div>
                    {account.notes && (
                      <p className="text-xs mt-1" style={{ color: '#6E7F86' }}>{account.notes}</p>
                    )}

                    {top ? (
                      <div className="mt-2">
                        <IntentSignalDisplay signal={top} compact />
                      </div>
                    ) : (
                      <p className="text-xs mt-2" style={{ color: '#6E7F86' }}>
                        No signals yet — paste one when you spot something
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#6E7F86' }}>
                      {checkedHoursAgo !== null ? (
                        <span>Checked {formatFreshness(checkedHoursAgo)} ago</span>
                      ) : (
                        <span style={{ color: '#D08A3E' }}>Never checked</span>
                      )}
                      <span>·</span>
                      <span>{signals.length} signal{signals.length === 1 ? '' : 's'} total</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { markWatchlistChecked(account.id); toast.success('Marked checked'); }}
                      className="text-xs px-2 py-1 rounded-md flex items-center gap-1"
                      style={{ background: 'rgba(30,111,112,0.1)', color: '#1E6F70', border: '1px solid rgba(30,111,112,0.2)' }}
                      title="Mark as checked today"
                    >
                      <Calendar size={11} />
                      Mark checked
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : account.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(58,143,163,0.1)', border: '1px solid rgba(58,143,163,0.2)' }}
                    >
                      {isExpanded
                        ? <ChevronUp size={13} color="#1E6F70" />
                        : <ChevronDown size={13} color="#1E6F70" />}
                    </button>
                    <button
                      onClick={() => handleDelete(account)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(176,67,42,0.1)', border: '1px solid rgba(176,67,42,0.2)' }}
                    >
                      <Trash2 size={12} color="#CC6B4F" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs font-semibold" style={{ color: '#6E7F86' }}>
                      Signals ({signals.length})
                    </p>
                    {signals.length > 0 ? (
                      <div className="space-y-2">
                        {signals.map((s) => (
                          <div key={s.id} className="flex items-start gap-2">
                            <div className="flex-1">
                              <IntentSignalDisplay signal={s} />
                            </div>
                            <button
                              onClick={() => { deleteIntentSignal(s.id); toast.success('Signal removed'); }}
                              className="p-1 rounded mt-1"
                              style={{ background: 'rgba(176,67,42,0.08)' }}
                            >
                              <Trash2 size={10} color="#CC6B4F" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: '#6E7F86' }}>None yet.</p>
                    )}

                    <IntentSignalEditor watchlistAccountId={account.id} />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
