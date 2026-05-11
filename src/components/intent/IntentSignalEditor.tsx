// This component exists because: every screen that wants to attach intent
// signals (pipeline lead cards, watchlist accounts) needs the same paste-and-
// classify form. Keeping it here means the rules ("require a real
// occurredAt", "default-classify on paste") live in one place.

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { guessSignalType, signalTypeLabel } from '@/lib/intent';
import type { IntentSignal, IntentSignalType } from '@/lib/types';

const TYPES: IntentSignalType[] = [
  'job-posting', 'funding', 'product-launch', 'social-pain',
  'social-hiring', 'github-activity', 'press-mention', 'other',
];

interface Props {
  /** Attach the signal to a pipeline lead OR watchlist account — exactly one of these. */
  leadId?: string;
  watchlistAccountId?: string;
  onAdded?: () => void;
}

export default function IntentSignalEditor({ leadId, watchlistAccountId, onAdded }: Props) {
  const { addIntentSignal } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    content: '',
    url: '',
    type: 'other' as IntentSignalType,
    occurredAt: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });

  const handleContentChange = (val: string) => {
    setDraft((prev) => {
      // Auto-classify only if user hasn't explicitly picked a type yet
      const guessed = guessSignalType(val, prev.url);
      const type = prev.type === 'other' ? guessed : prev.type;
      return { ...prev, content: val, type };
    });
  };

  const handleSubmit = () => {
    if (!draft.content.trim()) {
      toast.error('Paste the signal content');
      return;
    }
    if (!leadId && !watchlistAccountId) {
      toast.error('Signal must attach to a lead or watchlist account');
      return;
    }
    const sig: IntentSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      watchlistAccountId,
      type: draft.type,
      title: draft.title.trim() || draft.content.slice(0, 60),
      content: draft.content.trim(),
      url: draft.url.trim() || undefined,
      occurredAt: new Date(draft.occurredAt).toISOString(),
      capturedAt: new Date().toISOString(),
    };
    addIntentSignal(sig);
    toast.success('Signal added');
    setDraft({ title: '', content: '', url: '', type: 'other', occurredAt: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    onAdded?.();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-all"
        style={{ background: 'rgba(208,138,62,0.1)', border: '1px solid rgba(208,138,62,0.25)', color: '#D08A3E' }}
      >
        <Plus size={11} />
        Add signal
      </button>
    );
  }

  return (
    <div className="rounded-lg p-3 space-y-2" style={{
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(208,138,62,0.25)',
    }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#D08A3E' }}>Add intent signal</span>
        <button onClick={() => setOpen(false)} className="p-0.5">
          <X size={12} color="#6E7F86" />
        </button>
      </div>
      <textarea
        rows={2}
        placeholder="Paste a quote, post, news headline, or job posting…"
        value={draft.content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="input-field text-xs w-full resize-none"
      />
      <input
        className="input-field text-xs w-full"
        placeholder="Source URL (optional)"
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
      />
      <input
        className="input-field text-xs w-full"
        placeholder="Title (optional, auto-generated from content)"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input-field text-xs"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as IntentSignalType })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t} style={{ background: '#F7F2E7' }}>{signalTypeLabel(t)}</option>
          ))}
        </select>
        <input
          type="date"
          className="input-field text-xs"
          value={draft.occurredAt}
          onChange={(e) => setDraft({ ...draft, occurredAt: e.target.value })}
          title="When did the signal happen? (drives the freshness glow)"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="btn-primary w-full text-xs flex items-center justify-center gap-1"
      >
        <Plus size={11} />
        Save signal
      </button>
    </div>
  );
}
