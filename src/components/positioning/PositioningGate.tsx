// This component exists because: every generator (messages, posts, sequences,
// briefs, tweets) has to refuse to run until the user has committed to a sharp
// positioning. Wrapping each generator in <PositioningGate> centralises that
// rule so we can't forget it on a new feature.

import React from 'react';
import { Crosshair, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { isPositioningComplete } from '@/lib/positioning';

interface Props {
  children: React.ReactNode;
  /** Optional override label, e.g. "Set positioning before generating posts." */
  reason?: string;
}

export default function PositioningGate({ children, reason }: Props) {
  const { userPositioning, setCurrentPage } = useStore();
  const ready = isPositioningComplete(userPositioning);

  if (ready) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
        border: '1px solid rgba(99,102,241,0.3)',
      }}>
        <Crosshair size={24} color="#a5b4fc" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Syne' }}>
        Set your positioning first
      </h3>
      <p className="text-sm text-center max-w-md mb-5" style={{ color: '#64748b' }}>
        {reason || 'Generators are disabled until you commit to a niche, problem, mechanism, outcome, and proof. A vague offer guarantees vague replies.'}
      </p>
      <button
        onClick={() => setCurrentPage('positioning')}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        Open Positioning Setup
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
