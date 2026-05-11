// This component exists because: the user needs to be reminded of their
// committed positioning every time they generate. It surfaces the exact ICP
// the AI will be told to write for, so a misaligned generation is obvious.

import React from 'react';
import { Crosshair, Edit3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { isPositioningComplete } from '@/lib/positioning';

export default function PositioningBanner() {
  const { userPositioning, setCurrentPage } = useStore();
  if (!isPositioningComplete(userPositioning)) return null;

  const p = userPositioning;

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{
        background: 'linear-gradient(90deg, rgba(58,143,163,0.08), rgba(30,111,112,0.04))',
        border: '1px solid rgba(58,143,163,0.18)',
      }}
    >
      <Crosshair size={14} color="#1E6F70" className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: '#D6CCB6' }}>
          <span style={{ color: '#1E6F70' }}>{p.targetRole}</span> @ {p.targetCompanyType} · {p.outcomeMetric}{p.outcomeIsProjected ? ' (projected)' : ''}
        </p>
      </div>
      <button
        onClick={() => setCurrentPage('positioning')}
        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
        style={{ background: 'rgba(58,143,163,0.12)', color: '#1E6F70' }}
        title="Edit positioning"
      >
        <Edit3 size={10} />
        <span className="hidden sm:inline">Edit</span>
      </button>
    </div>
  );
}
