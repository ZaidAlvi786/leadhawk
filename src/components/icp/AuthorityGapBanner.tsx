// This component exists because: the brief calls this "the single nudge worth
// more than any other feature." If the user has 14 active leads in ICP=X but
// hasn't posted to that ICP in 9 days, every cold DM is 3-5x less likely to
// convert. The banner makes that gap impossible to ignore — without it, the
// user spends weeks DMing a cold pipeline and wonders why nothing converts.

import React from 'react';
import { Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { computeAuthorityGaps, topAuthorityGap } from '@/lib/icp';

interface Props {
  /** Optional handler — when set, pressing the CTA navigates to LinkedIn Growth.
   *  Defaults to setting currentPage if not provided. */
  onAct?: () => void;
}

export default function AuthorityGapBanner({ onAct }: Props) {
  const { posts, pipelineLeads, userPositioning, setCurrentPage } = useStore();
  const gaps = computeAuthorityGaps({ posts, leads: pipelineLeads, positioning: userPositioning });
  const top = topAuthorityGap(gaps);

  if (!top) return null;

  const isCritical = top.severity === 'critical';
  const color = isCritical ? '#B0432A' : '#D08A3E';
  const bg = isCritical ? 'rgba(176,67,42,0.06)' : 'rgba(208,138,62,0.06)';
  const border = isCritical ? 'rgba(176,67,42,0.3)' : 'rgba(208,138,62,0.3)';

  const daysText = top.daysSinceLastPost == null
    ? 'never posted to that ICP'
    : `haven't posted to that ICP in ${top.daysSinceLastPost} day${top.daysSinceLastPost === 1 ? '' : 's'}`;

  const handleAct = () => {
    if (onAct) {
      onAct();
    } else {
      setCurrentPage('linkedin-growth');
    }
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          {isCritical
            ? <AlertTriangle size={15} color={color} />
            : <Zap size={15} color={color} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold" style={{ color, fontFamily: 'Syne' }}>
              Authority Gap · {top.severity === 'critical' ? 'CRITICAL' : 'Warning'}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#E6DCC8' }}>
            You have <strong style={{ color }}>{top.activeLeadCount}</strong> active{' '}
            {top.activeLeadCount === 1 ? 'lead' : 'leads'} in ICP <em style={{ color: '#1E6F70' }}>"{top.icpTag}"</em>{' '}
            but {daysText}. Cold DMs to people who can't find proof you understand them are 3–5x less likely to convert.
          </p>
        </div>

        <button
          onClick={handleAct}
          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0 font-medium"
          style={{
            background: color,
            color: 'white',
          }}
        >
          Generate post
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
