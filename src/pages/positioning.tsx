import React, { useState } from 'react';
import { Crosshair, Edit3, ExternalLink } from 'lucide-react';
import { useStore } from '@/lib/store';
import { isPositioningComplete } from '@/lib/positioning';
import PositioningSetup from '@/components/positioning/PositioningSetup';

export default function PositioningPage() {
  const { userPositioning } = useStore();
  const [editing, setEditing] = useState(!isPositioningComplete(userPositioning));

  if (editing) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <PositioningSetup onComplete={() => setEditing(false)} />
        </div>
      </div>
    );
  }

  const p = userPositioning;
  const lastUpdated = p.lastUpdated ? new Date(p.lastUpdated) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 md:px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-2">
          <Crosshair size={18} color="#6366f1" />
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Syne' }}>
            Your Positioning
          </h2>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Edit3 size={13} />
          Edit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl space-y-4">
          {/* The committed positioning, in human-readable form */}
          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#a5b4fc' }}>Commitment</p>
            <p className="text-base leading-relaxed" style={{ color: '#e2e8f0' }}>
              I help <span style={{ color: '#a5b4fc' }}>{p.targetRole}</span> at <span style={{ color: '#a5b4fc' }}>{p.targetCompanyType}</span>.
            </p>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#fcd34d' }}>Painful problem</p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{p.painfulProblem}</p>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>Mechanism</p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{p.mechanism}</p>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#06b6d4' }}>Outcome</p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
              {p.outcomeMetric} — {p.outcomeTimeframe}
              {p.outcomeIsProjected && (
                <span className="ml-2 tag tag-amber text-xs">projected</span>
              )}
            </p>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#a5b4fc' }}>Proof assets ({p.proofAssets.length})</p>
            <div className="space-y-1">
              {p.proofAssets.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <ExternalLink size={12} color="#94a3b8" />
                  <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{a.label}</span>
                  <span className="text-xs ml-auto" style={{ color: '#64748b' }}>{a.type}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>NOT for</p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{p.notFor}</p>
          </div>

          {lastUpdated && (
            <p className="text-xs text-center" style={{ color: '#475569' }}>
              Last updated {lastUpdated.toLocaleDateString()} · v{p.version}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
