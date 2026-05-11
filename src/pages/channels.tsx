// This page exists because: Operating Principle #5 says inbound and outbound
// are one system. This page is the "outbound" half's diversification — every
// channel beyond Sales Navigator. Sales Nav stays in /leads (its natural
// home); this page is everything else, with the Channel Mix Coach at the
// top so the user *sees* their distribution.

import React, { useState } from 'react';
import { Layers, UserPlus, Briefcase } from 'lucide-react';
import ChannelCapture from '@/components/channels/ChannelCapture';
import WarmIntroTracker from '@/components/channels/WarmIntroTracker';
import ChannelMixCoach from '@/components/channels/ChannelMixCoach';
import SalesNavHonestyPanel from '@/components/channels/SalesNavHonestyPanel';
import PositioningGate from '@/components/positioning/PositioningGate';
import PositioningBanner from '@/components/positioning/PositioningBanner';

const TABS = [
  { id: 'capture', label: 'Capture', icon: Briefcase, description: 'YC, Wellfound, social search, funding news' },
  { id: 'warm',    label: 'Warm Intros', icon: UserPlus, description: 'Past colleagues, ex-clients, mutuals' },
];

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState('capture');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D08A3E, #B0432A)' }}>
            <Layers size={13} color="white" />
          </div>
          <span className="text-xs font-medium tag tag-amber">Channel Mix</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
          Channels Beyond Sales Navigator
        </h2>
        <p className="text-sm" style={{ color: '#6E7F86' }}>
          Top operators win on portfolio mix, not channel mastery. Capture intent from anywhere.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-4 pb-0">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl max-w-full" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          width: 'fit-content',
        }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: isActive ? 'rgba(58,143,163,0.2)' : 'transparent',
                  color: isActive ? '#1E6F70' : '#6E7F86',
                  border: isActive ? '1px solid rgba(58,143,163,0.3)' : '1px solid transparent',
                }}
                title={tab.description}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        <PositioningBanner />
        <SalesNavHonestyPanel />
        <ChannelMixCoach />

        <PositioningGate reason="Channel recommendations need a clear ICP. Set positioning first.">
          {activeTab === 'capture' && <ChannelCapture />}
          {activeTab === 'warm'    && <WarmIntroTracker />}
        </PositioningGate>
      </div>
    </div>
  );
}
