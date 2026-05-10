// This component exists because: showing the user the 4 labeled parts of
// every outreach message — instead of one opaque blob — is how they internalize
// the structure. Over a few weeks, they should stop needing the AI to write
// these because they'll see the pattern.

import React from 'react';
import { MapPin, Zap, Award, MousePointer, Edit3 } from 'lucide-react';
import type { OutreachComponents } from '@/lib/types';

interface Props {
  components: OutreachComponents;
  onChange?: (next: OutreachComponents) => void;
  /** When true, the four parts are editable inline. Default: false (preview). */
  editable?: boolean;
}

const PARTS: { key: keyof Omit<OutreachComponents, 'sourceFieldIds' | 'assembledMessage'>; label: string; subtitle: string; icon: typeof MapPin; color: string }[] = [
  { key: 'specificReference', label: 'Specific reference', subtitle: 'sourced from real research', icon: MapPin, color: '#06b6d4' },
  { key: 'patternInterrupt', label: 'Pattern interrupt',  subtitle: 'breaks the "another DM" frame', icon: Zap, color: '#f59e0b' },
  { key: 'earnedRight',      label: 'Earned right',       subtitle: 'one line of relevant proof',   icon: Award, color: '#10b981' },
  { key: 'lowFrictionAsk',   label: 'Low-friction ask',   subtitle: 'small ask, NOT "30-min call"', icon: MousePointer, color: '#a78bfa' },
];

export default function OutreachComponentDisplay({ components, onChange, editable = false }: Props) {
  const update = (key: typeof PARTS[number]['key'], value: string) => {
    if (!onChange) return;
    onChange({ ...components, [key]: value });
  };

  return (
    <div className="space-y-2">
      {PARTS.map((p) => {
        const Icon = p.icon;
        const value = components[p.key] || '';
        return (
          <div
            key={p.key}
            className="rounded-lg p-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${value ? `${p.color}33` : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={11} color={p.color} />
              <span className="text-xs font-semibold" style={{ color: p.color, fontFamily: 'Syne' }}>
                {p.label}
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>· {p.subtitle}</span>
              {editable && <Edit3 size={9} color="#475569" className="ml-auto" />}
            </div>
            {editable ? (
              <textarea
                rows={value.length > 80 ? 2 : 1}
                className="input-field text-sm w-full resize-none"
                placeholder={`(empty — ${p.label.toLowerCase()})`}
                value={value}
                onChange={(e) => update(p.key, e.target.value)}
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: value ? '#e2e8f0' : '#475569' }}>
                {value || `(empty — ${p.label.toLowerCase()})`}
              </p>
            )}
          </div>
        );
      })}

      {/* Source citation chip */}
      {components.sourceFieldIds?.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{
          background: 'rgba(16,185,129,0.08)',
          color: '#6ee7b7',
        }}>
          <span>✓</span>
          <span>Reference cites {components.sourceFieldIds.length} source{components.sourceFieldIds.length === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
}
