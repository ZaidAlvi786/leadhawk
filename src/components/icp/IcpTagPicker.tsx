// This component exists because: every entity that has an `icpTag` needs the
// same pick-or-type-it UX. Centralising it means the user's known ICPs come
// out as a dropdown of stable choices (not free-form drift) AND they can
// add a secondary ICP when they're targeting a related-but-different segment.

import React, { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { knownIcps, primaryIcpLabel } from '@/lib/icp';

interface Props {
  value: string | undefined;
  onChange: (tag: string | undefined) => void;
  /** Compact mode renders a small pill-style picker for use inside cards/forms. */
  compact?: boolean;
  /** Allow clearing the tag entirely. Default: false. */
  allowClear?: boolean;
}

export default function IcpTagPicker({ value, onChange, compact = false, allowClear = false }: Props) {
  const { userPositioning, posts, tweets, twitterThreads, pipelineLeads } = useStore();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const tags = knownIcps({
    positioning: userPositioning,
    posts,
    tweets,
    threads: twitterThreads,
    leads: pipelineLeads,
  });
  const primary = primaryIcpLabel(userPositioning);

  const display = value || primary || 'No ICP set';
  const isPrimary = value && primary && value === primary;

  const pickTag = (tag: string | undefined) => {
    onChange(tag);
    setOpen(false);
    setAdding(false);
    setDraft('');
  };

  const handleAddCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    pickTag(trimmed);
  };

  if (compact) {
    return (
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1 transition-all relative"
        style={{
          background: isPrimary ? 'rgba(58,143,163,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isPrimary ? 'rgba(58,143,163,0.35)' : 'rgba(255,255,255,0.1)'}`,
          color: value ? '#1E6F70' : '#6E7F86',
        }}
      >
        <span className="truncate max-w-[180px]">{display}</span>
        <ChevronDown size={9} />
        {open && (
          <div
            className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto"
            style={{
              background: '#0F3B47',
              border: '1px solid rgba(58,143,163,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <PickerBody
              value={value} tags={tags} primary={primary}
              adding={adding} setAdding={setAdding}
              draft={draft} setDraft={setDraft}
              onPick={pickTag} onAddCustom={handleAddCustom}
              allowClear={allowClear}
            />
          </div>
        )}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full input-field text-sm flex items-center justify-between"
      >
        <span style={{ color: value ? '#D6CCB6' : '#6E7F86' }}>{display}</span>
        <ChevronDown size={12} color="#6E7F86" />
      </button>
      {open && (
        <div
          className="mt-1 rounded-lg shadow-lg max-h-72 overflow-y-auto"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(58,143,163,0.3)',
          }}
        >
          <PickerBody
            value={value} tags={tags} primary={primary}
            adding={adding} setAdding={setAdding}
            draft={draft} setDraft={setDraft}
            onPick={pickTag} onAddCustom={handleAddCustom}
            allowClear={allowClear}
          />
        </div>
      )}
    </div>
  );
}

interface BodyProps {
  value: string | undefined;
  tags: string[];
  primary: string | undefined;
  adding: boolean;
  setAdding: (b: boolean) => void;
  draft: string;
  setDraft: (s: string) => void;
  onPick: (tag: string | undefined) => void;
  onAddCustom: () => void;
  allowClear: boolean;
}

function PickerBody({ value, tags, primary, adding, setAdding, draft, setDraft, onPick, onAddCustom, allowClear }: BodyProps) {
  return (
    <div className="py-1">
      {tags.length === 0 && !adding && (
        <p className="text-xs px-3 py-2" style={{ color: '#6E7F86' }}>
          No ICPs known yet. Set positioning first or add a custom tag below.
        </p>
      )}
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onPick(tag)}
          className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 transition-all"
          style={{ color: value === tag ? '#1E6F70' : '#D6CCB6' }}
        >
          <span className="truncate">{tag}</span>
          {tag === primary && (
            <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#6E7F86' }}>primary</span>
          )}
        </button>
      ))}
      {allowClear && value && (
        <button
          onClick={() => onPick(undefined)}
          className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-white/5"
          style={{ color: '#6E7F86' }}
        >
          <X size={9} /> Clear ICP
        </button>
      )}
      <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      {adding ? (
        <div className="px-2 pb-2">
          <div className="flex gap-1">
            <input
              autoFocus
              className="input-field text-xs flex-1"
              placeholder="e.g. Marketing Director @ Mid-market SaaS"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddCustom()}
            />
            <button
              onClick={onAddCustom}
              className="text-xs px-2 rounded"
              style={{ background: 'rgba(58,143,163,0.18)', color: '#1E6F70' }}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-white/5"
          style={{ color: '#1E6F70' }}
        >
          <Plus size={10} /> Add secondary ICP…
        </button>
      )}
    </div>
  );
}
