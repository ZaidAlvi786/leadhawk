// This component exists because: every active lead that's been parked too
// long is silent revenue leakage. The brief calls out 5 stuck-states; this
// panel surfaces them in one place so the user *sees* what they're letting
// rot, instead of imagining the pipeline is healthy.

import React from 'react';
import { AlertTriangle, Clock, ArrowRight, Mic, FileText, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { whatsStuck } from '@/lib/analytics';
import type { StuckItem, StuckItemKind } from '@/lib/analytics';

const KIND_ICONS: Record<StuckItemKind, typeof AlertTriangle> = {
  'replied-stale':    MessageCircle,
  'meeting-stale':    Mic,
  'proposal-stale':   FileText,
  'no-call-recently': Clock,
  'no-post-recently': AlertTriangle,
};

export default function WhatsStuckPanel() {
  const { pipelineLeads, posts, setCurrentPage } = useStore();
  const items = whatsStuck(pipelineLeads, posts);

  if (items.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <Clock size={16} color="#10b981" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#6ee7b7', fontFamily: 'Syne' }}>Nothing's stuck</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            Pipeline is moving and you've posted recently. Keep going.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: '#fcd34d', fontFamily: 'Syne' }}>
          What's Stuck
        </h3>
        <span className="text-xs" style={{ color: '#64748b' }}>
          {items.length} item{items.length === 1 ? '' : 's'} need{items.length === 1 ? 's' : ''} a move
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const Icon = KIND_ICONS[item.kind];
          const isCritical = item.severity === 'critical';
          const color = isCritical ? '#ef4444' : '#f59e0b';
          const bg = isCritical ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.05)';
          const border = isCritical ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.22)';

          return (
            <button
              key={`${item.kind}-${item.leadId ?? i}`}
              onClick={() => goTo(item, setCurrentPage)}
              className="w-full text-left p-3 rounded-lg flex items-start gap-2 transition-all hover:bg-white/5"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <Icon size={13} color={color} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>
                  {item.message}
                </p>
              </div>
              <ArrowRight size={11} color={color} className="flex-shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function goTo(item: StuckItem, setCurrentPage: (p: 'pipeline' | 'linkedin-growth') => void) {
  if (item.kind === 'no-post-recently') {
    setCurrentPage('linkedin-growth');
  } else {
    // every other stuck-item type is about pipeline state
    setCurrentPage('pipeline');
  }
}
