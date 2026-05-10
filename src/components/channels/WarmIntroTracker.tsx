// This component exists because: the brief calls warm intros the most-skipped
// channel — beginners ignore their warm network and waste months on cold DMs.
// The tracker is intentionally minimal (name, relationship, last-touched).
// The discipline is in the touching, not the schema.

import React, { useState } from 'react';
import { UserPlus, Trash2, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { warmStaleness, WARM_STALE_DAYS } from '@/lib/channels';
import type { WarmContact } from '@/lib/types';

export default function WarmIntroTracker() {
  const { warmContacts, addWarmContact, deleteWarmContact, markWarmTouched } = useStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', relationship: '', channel: '', url: '', notes: '' });

  const now = new Date();
  const staleCount = warmContacts.filter((c) => {
    const s = warmStaleness(c, now);
    return s === 'stale' || s === 'very-stale' || s === 'never';
  }).length;

  const handleAdd = () => {
    if (!draft.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!draft.relationship.trim()) {
      toast.error('How do you know them? (relationship is required)');
      return;
    }
    addWarmContact({
      id: `wc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name.trim(),
      relationship: draft.relationship.trim(),
      channel: draft.channel.trim() || undefined,
      url: draft.url.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      createdAt: now.toISOString(),
    });
    setDraft({ name: '', relationship: '', channel: '', url: '', notes: '' });
    setAdding(false);
    toast.success('Added to warm intros');
  };

  // Sort: never-touched first, then most-stale → freshest
  const sorted = [...warmContacts].sort((a, b) => {
    const sa = warmStaleness(a, now);
    const sb = warmStaleness(b, now);
    const order = { 'never': 0, 'very-stale': 1, 'stale': 2, 'fresh': 3 };
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    const ta = a.lastTouchedAt ? new Date(a.lastTouchedAt).getTime() : 0;
    const tb = b.lastTouchedAt ? new Date(b.lastTouchedAt).getTime() : 0;
    return ta - tb;
  });

  return (
    <div className="space-y-3">
      {/* Discipline reminder */}
      <div className="rounded-lg p-3" style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}>
        <p className="text-xs leading-relaxed" style={{ color: '#fcd34d' }}>
          <strong>Warm intros convert ~10x better than cold DMs.</strong> Pick 2–3 to touch this week. The discipline is in the touching, not the list.
        </p>
      </div>

      {/* Header + add */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#fcd34d', fontFamily: 'Syne' }}>
            Warm Intros · {warmContacts.length}
          </p>
          {staleCount > 0 && (
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {staleCount} contact{staleCount === 1 ? '' : 's'} need{staleCount === 1 ? 's' : ''} a touch
            </p>
          )}
        </div>
        <button
          className="btn-primary text-xs flex items-center gap-1"
          onClick={() => setAdding(!adding)}
        >
          <UserPlus size={11} />
          Add contact
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-lg p-3 space-y-2" style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.18)',
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="input-field text-sm"
              placeholder="Name *"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <input
              className="input-field text-sm"
              placeholder="How you know them *"
              value={draft.relationship}
              onChange={(e) => setDraft({ ...draft, relationship: e.target.value })}
            />
            <input
              className="input-field text-sm"
              placeholder="Channel (LinkedIn, WhatsApp, Email…)"
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
            />
            <input
              className="input-field text-sm"
              placeholder="LinkedIn / contact URL (optional)"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
            <textarea
              className="input-field text-sm md:col-span-2 resize-none"
              rows={2}
              placeholder="Why they matter (e.g. 'CTO at growing fintech, mentioned hiring in Q2')"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs flex-1">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-xs flex-1">Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {warmContacts.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <UserPlus size={20} color="#f59e0b" />
          </div>
          <p className="text-sm text-center" style={{ color: '#94a3b8' }}>
            No warm contacts yet
          </p>
          <p className="text-xs text-center max-w-md mt-1" style={{ color: '#64748b' }}>
            List 5–10 people you already know who could plausibly hire you or refer someone who would.
            Past colleagues, ex-clients, mutual friends.
          </p>
        </div>
      )}

      {/* List */}
      {sorted.map((c) => (
        <WarmContactRow
          key={c.id}
          contact={c}
          now={now}
          onTouch={() => { markWarmTouched(c.id); toast.success(`Marked ${c.name} touched`); }}
          onDelete={() => { if (confirm(`Remove ${c.name}?`)) { deleteWarmContact(c.id); toast.success('Removed'); } }}
        />
      ))}
    </div>
  );
}

function WarmContactRow({ contact, now, onTouch, onDelete }: {
  contact: WarmContact; now: Date; onTouch: () => void; onDelete: () => void;
}) {
  const stale = warmStaleness(contact, now);
  const colorMap = {
    'fresh':      { bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.18)', label: '#6ee7b7' },
    'stale':      { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.22)', label: '#fcd34d' },
    'very-stale': { bg: 'rgba(239,68,68,0.05)',  border: 'rgba(239,68,68,0.25)',  label: '#fca5a5' },
    'never':      { bg: 'rgba(167,139,250,0.05)', border: 'rgba(167,139,250,0.25)', label: '#c4b5fd' },
  } as const;
  const c = colorMap[stale];

  const lastTouched = contact.lastTouchedAt
    ? `Last touched ${Math.floor((now.getTime() - new Date(contact.lastTouchedAt).getTime()) / 86_400_000)}d ago`
    : 'Never touched';

  return (
    <div className="rounded-lg p-3 flex items-start gap-3" style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
    }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{contact.name}</p>
          {stale !== 'fresh' && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{
              background: c.bg, color: c.label, border: `1px solid ${c.border}`,
            }}>
              {stale === 'never' ? 'never touched' : stale}
            </span>
          )}
          {contact.url && (
            <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}>
              <ExternalLink size={10} /> link
            </a>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
          {contact.relationship}{contact.channel ? ` · via ${contact.channel}` : ''}
        </p>
        {contact.notes && (
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>{contact.notes}</p>
        )}
        <p className="text-xs mt-1" style={{ color: c.label }}>
          {stale === 'never' && <AlertCircle size={9} className="inline mr-1" />}
          {lastTouched}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onTouch}
          className="text-xs px-2 py-1 rounded-md flex items-center gap-1"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}
          title="Mark as touched today"
        >
          <Calendar size={11} />
          Touched
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <Trash2 size={11} color="#f87171" />
        </button>
      </div>
    </div>
  );
}
