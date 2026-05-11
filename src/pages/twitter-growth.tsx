import React, { useState } from 'react';
import { Share2, TrendingUp } from 'lucide-react';
import TweetGenerator from '@/components/twitter/TweetGenerator';
import TwitterThreadBuilder from '@/components/twitter/TwitterThreadBuilder';
import TwitterGrowthPlanGenerator from '@/components/twitter/TwitterGrowthPlanGenerator';
import PositioningGate from '@/components/positioning/PositioningGate';
import PositioningBanner from '@/components/positioning/PositioningBanner';

const TABS = [
  { id: 'tweets', label: 'Tweet Generator', icon: Share2, description: 'Single tweets & threads' },
  { id: 'growth', label: 'Growth Plan', icon: TrendingUp, description: '4/8/12-week strategy' },
];

export default function TwitterGrowthPage() {
  const [activeTab, setActiveTab] = useState('tweets');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E6F70, #0ea5e9)' }}>
            <Share2 size={13} color="white" />
          </div>
          <span className="text-xs font-medium tag" style={{ background: 'rgba(30,111,112,0.2)', color: '#1E6F70', border: '1px solid rgba(30,111,112,0.3)' }}>
            X / Twitter Growth
          </span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
          Grow Your X / Twitter Presence
        </h2>
        <p className="text-sm" style={{ color: '#6E7F86' }}>
          Generate tweets, threads, and growth strategies tied to your positioning
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-4 pb-0">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl max-w-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
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
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        <PositioningBanner />
        <PositioningGate reason="Tweets that don't tie back to a specific ICP rarely convert to clients. Set positioning first.">
          {activeTab === 'tweets' && (
            <div className="space-y-6">
              <TweetGenerator />
              <TwitterThreadBuilder />
            </div>
          )}
          {activeTab === 'growth' && <TwitterGrowthPlanGenerator />}
        </PositioningGate>
      </div>
    </div>
  );
}
