// This component exists because: the brief's 6.3 — the Channel Mix Coach.
// "You've spent 87% of your time this week on Sales Navigator cold outreach.
// Top operators in your stage spend ~30% on cold, ~30% on warm, ~40% on
// inbound content. Adjust?" Without this nudge, the user spends months
// over-indexed on the easiest channel and wonders why nothing converts.

import React from 'react';
import { Scale, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { channelMixSummary, IDEAL_CHANNEL_MIX, type ChannelGroup } from '@/lib/channels';

const GROUP_META: Record<ChannelGroup, { label: string; color: string }> = {
  cold:    { label: 'Cold outbound', color: '#06b6d4' },
  warm:    { label: 'Warm intros',   color: '#f59e0b' },
  inbound: { label: 'Inbound',       color: '#10b981' },
};

export default function ChannelMixCoach() {
  const { pipelineLeads } = useStore();
  const summary = channelMixSummary(pipelineLeads);

  if (summary.total === 0) {
    return null; // nothing to show until there's at least one lead
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={14} color="#a5b4fc" />
          <h3 className="text-sm font-semibold" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
            Channel Mix
          </h3>
        </div>
        <span className="text-xs" style={{ color: '#64748b' }}>
          {summary.total} lead{summary.total === 1 ? '' : 's'} · ideal: 30/30/40
        </span>
      </div>

      {/* Stacked bar — your actual mix */}
      <div>
        <p className="text-xs mb-1" style={{ color: '#64748b' }}>You</p>
        <MixBar ratios={summary.ratios} totals={summary.totals} />
      </div>

      {/* Stacked bar — ideal mix for reference */}
      <div className="mt-2">
        <p className="text-xs mb-1" style={{ color: '#64748b' }}>Top operators</p>
        <MixBar
          ratios={IDEAL_CHANNEL_MIX}
          totals={{ cold: 0, warm: 0, inbound: 0 }}
          showCounts={false}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {(['cold', 'warm', 'inbound'] as const).map((g) => (
          <div key={g} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: GROUP_META[g].color }} />
            <span className="text-xs" style={{ color: '#94a3b8' }}>{GROUP_META[g].label}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {summary.imbalanced && (
        <div className="mt-3 space-y-1">
          {summary.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}>
              <AlertCircle size={12} color="#fcd34d" className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: '#fcd34d' }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      {!summary.imbalanced && summary.total >= 5 && (
        <p className="text-xs mt-3" style={{ color: '#6ee7b7' }}>
          ✓ Mix looks balanced — keep diversifying as the pipeline grows.
        </p>
      )}

      {summary.total < 5 && (
        <p className="text-xs mt-3" style={{ color: '#475569' }}>
          Add at least 5 leads before the coach calls anything out — small samples lie.
        </p>
      )}
    </div>
  );
}

interface MixBarProps {
  ratios: Record<ChannelGroup, number>;
  totals: Record<ChannelGroup, number>;
  showCounts?: boolean;
}

function MixBar({ ratios, totals, showCounts = true }: MixBarProps) {
  return (
    <div className="flex w-full h-6 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      {(['cold', 'warm', 'inbound'] as const).map((g) => {
        const pct = ratios[g] * 100;
        if (pct === 0) return null;
        return (
          <div
            key={g}
            className="flex items-center justify-center text-xs font-medium"
            style={{
              background: GROUP_META[g].color,
              width: `${pct}%`,
              color: '#0a1628',
            }}
            title={`${GROUP_META[g].label}: ${pct.toFixed(0)}%${showCounts ? ` (${totals[g]} leads)` : ''}`}
          >
            {pct >= 12 && `${pct.toFixed(0)}%`}
          </div>
        );
      })}
    </div>
  );
}
