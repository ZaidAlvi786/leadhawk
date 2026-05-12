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

type PartKey = keyof Omit<OutreachComponents, 'sourceFieldIds' | 'assembledMessage' | 'mode'>;

// Same 4 fields, different labels per mode. Services mode reframes components
// 2-4 as builder-acknowledgement / help-offer / permission-ask so the UI
// matches what the model was actually asked to produce.
const PARTS_PRODUCT: { key: PartKey; label: string; subtitle: string; icon: typeof MapPin; color: string }[] = [
  { key: 'specificReference', label: 'Specific reference', subtitle: 'sourced from real research', icon: MapPin, color: '#1E6F70' },
  { key: 'patternInterrupt', label: 'Pattern interrupt',  subtitle: 'breaks the "another DM" frame', icon: Zap, color: '#D08A3E' },
  { key: 'earnedRight',      label: 'Earned right',       subtitle: 'one line of relevant proof',   icon: Award, color: '#1E6F70' },
  { key: 'lowFrictionAsk',   label: 'Low-friction ask',   subtitle: 'small ask, NOT "30-min call"', icon: MousePointer, color: '#CC6B4F' },
];

const PARTS_SERVICES: { key: PartKey; label: string; subtitle: string; icon: typeof MapPin; color: string }[] = [
  { key: 'specificReference', label: 'Specific reference',      subtitle: 'sourced from real research',          icon: MapPin, color: '#1E6F70' },
  { key: 'patternInterrupt', label: 'Builder acknowledgement',  subtitle: 'recognize the substance, not feelings', icon: Zap, color: '#D08A3E' },
  { key: 'earnedRight',      label: 'Help offer',               subtitle: 'concrete free value — not a pitch',    icon: Award, color: '#1E6F70' },
  { key: 'lowFrictionAsk',   label: 'Permission-framed ask',    subtitle: 'easy out — never a meeting request',   icon: MousePointer, color: '#CC6B4F' },
];

export default function OutreachComponentDisplay({ components, onChange, editable = false }: Props) {
  const parts = components.mode === 'services' ? PARTS_SERVICES : PARTS_PRODUCT;

  const update = (key: PartKey, value: string) => {
    if (!onChange) return;
    onChange({ ...components, [key]: value });
  };

  return (
    <div className="space-y-2">
      {parts.map((p) => {
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
              <span className="text-xs" style={{ color: '#6E7F86' }}>· {p.subtitle}</span>
              {editable && <Edit3 size={9} color="#6E7F86" className="ml-auto" />}
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
              <p className="text-sm leading-relaxed" style={{ color: value ? '#E6DCC8' : '#6E7F86' }}>
                {value || `(empty — ${p.label.toLowerCase()})`}
              </p>
            )}
          </div>
        );
      })}

      {/* Source citation chip */}
      {components.sourceFieldIds?.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{
          background: 'rgba(30,111,112,0.08)',
          color: '#1E6F70',
        }}>
          <span>✓</span>
          <span>Reference cites {components.sourceFieldIds.length} source{components.sourceFieldIds.length === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
}
