// This component exists because: the freshest signal on a lead card is what
// tells the user *who to message right now*. The brief is explicit — hot
// signals (<72h) should glow, cold leads should look cold so the user *sees*
// their pipeline rot rather than imagining it's healthy.

import React from 'react';
import { ExternalLink, Zap, Clock } from 'lucide-react';
import { freshnessHours, classifyFreshness, formatFreshness, signalTypeLabel } from '@/lib/intent';
import type { IntentSignal } from '@/lib/types';

interface Props {
  signal: IntentSignal;
  compact?: boolean;
}

const FRESHNESS_STYLES = {
  hot: {
    bg: 'rgba(208,138,62,0.12)',
    border: 'rgba(208,138,62,0.45)',
    color: '#D08A3E',
    glow: '0 0 16px rgba(208,138,62,0.35)',
    label: 'HOT',
  },
  warm: {
    bg: 'rgba(58,143,163,0.1)',
    border: 'rgba(58,143,163,0.3)',
    color: '#1E6F70',
    glow: 'none',
    label: 'warm',
  },
  cool: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    color: '#6E7F86',
    glow: 'none',
    label: 'cool',
  },
  cold: {
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.04)',
    color: '#6E7F86',
    glow: 'none',
    label: 'cold',
  },
} as const;

export default function IntentSignalDisplay({ signal, compact = false }: Props) {
  const hours = freshnessHours(signal);
  const freshness = classifyFreshness(hours);
  const style = FRESHNESS_STYLES[freshness];

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.color,
          boxShadow: style.glow,
        }}
        title={`${signal.title} · ${formatFreshness(hours)} ago`}
      >
        {freshness === 'hot' ? <Zap size={10} /> : <Clock size={10} />}
        <span className="truncate max-w-[140px]">{signal.title}</span>
        <span className="opacity-70 flex-shrink-0">· {formatFreshness(hours)}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.glow,
      }}
    >
      <div className="flex items-start gap-2 mb-1">
        {freshness === 'hot' ? <Zap size={12} color={style.color} /> : <Clock size={12} color={style.color} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium" style={{ color: style.color }}>{style.label}</span>
            <span className="text-xs" style={{ color: style.color, opacity: 0.7 }}>·</span>
            <span className="text-xs" style={{ color: style.color, opacity: 0.85 }}>
              {signalTypeLabel(signal.type)}
            </span>
            <span className="text-xs ml-auto" style={{ color: style.color, opacity: 0.6 }}>
              {formatFreshness(hours)} ago
            </span>
          </div>
          <p className="text-xs font-semibold" style={{ color: '#E6DCC8' }}>{signal.title}</p>
          {signal.content && signal.content !== signal.title && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6E7F86' }}>{signal.content}</p>
          )}
        </div>
        {signal.url && (
          <a href={signal.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 mt-0.5">
            <ExternalLink size={10} color={style.color} />
          </a>
        )}
      </div>
    </div>
  );
}
