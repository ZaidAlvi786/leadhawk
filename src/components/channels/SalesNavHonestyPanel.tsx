// This component exists because: the brief calls for being honest with the
// user that Sales Navigator alone won't get them clients. Surfacing the
// strengths AND weaknesses inline (with a positioning-aware ranked channel
// list) keeps the user from sinking 90% of their time into the wrong tool.

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { recommendedChannels, type ChannelKind } from '@/lib/channels';
import { primaryIcpLabel } from '@/lib/icp';
import type { NavPage } from '@/lib/types';

const CHANNEL_NAV: Partial<Record<ChannelKind, NavPage>> = {
  'warm-intros': 'channels',
  'yc-jobs': 'channels',
  'wellfound': 'channels',
  'social-search': 'channels',
  'funding-news': 'channels',
  'linkedin-content': 'linkedin-growth',
  'twitter-content': 'twitter-growth',
};

export default function SalesNavHonestyPanel() {
  const { userPositioning, setCurrentPage } = useStore();
  const [open, setOpen] = useState(true);
  const recs = recommendedChannels(userPositioning);
  const icp = primaryIcpLabel(userPositioning);

  return (
    <div className="rounded-xl" style={{
      background: 'rgba(208,138,62,0.04)',
      border: '1px solid rgba(208,138,62,0.2)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={14} color="#D08A3E" />
          <div>
            <p className="text-xs font-semibold" style={{ color: '#D08A3E', fontFamily: 'Syne' }}>
              Sales Navigator alone won't get you clients
            </p>
            <p className="text-xs" style={{ color: '#6E7F86' }}>
              Channel mix matters more than channel mastery — see your ranked recommendations
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={13} color="#6E7F86" /> : <ChevronDown size={13} color="#6E7F86" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(208,138,62,0.15)' }}>
          <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(30,111,112,0.06)', border: '1px solid rgba(30,111,112,0.18)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#1E6F70' }}>✓ Sales Nav is good for</p>
              <p className="text-xs" style={{ color: '#D6CCB6' }}>
                Enterprise SDR motions, large TAMs (1000+ companies in the niche), well-funded ICPs that staff dedicated buyers.
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(176,67,42,0.06)', border: '1px solid rgba(176,67,42,0.18)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#fca5a5' }}>✗ Sales Nav is weak for</p>
              <p className="text-xs" style={{ color: '#D6CCB6' }}>
                Indie consultants, AI-services boutiques, intent-driven outreach. The signal-to-noise is too low when your TAM is &lt;500.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              For your positioning {icp ? <span style={{ color: '#1E6F70' }}>({icp})</span> : <span style={{ color: '#6E7F86' }}>(set positioning to sharpen this)</span>}, prioritize in this order:
            </p>
            <div className="space-y-1.5">
              {recs.slice(0, 5).map((rec, i) => {
                const target = CHANNEL_NAV[rec.kind];
                return (
                  <button
                    key={rec.kind}
                    onClick={() => target && setCurrentPage(target)}
                    disabled={!target}
                    className="w-full text-left p-2.5 rounded-lg flex items-start gap-2 transition-all hover:bg-white/5 disabled:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{
                      background: i === 0 ? 'rgba(30,111,112,0.18)' : 'rgba(58,143,163,0.12)',
                      color: i === 0 ? '#1E6F70' : '#1E6F70',
                    }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#E6DCC8' }}>{rec.label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#6E7F86' }}>{rec.rationale}</p>
                    </div>
                    {target && <ArrowRight size={11} color="#6E7F86" className="flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
