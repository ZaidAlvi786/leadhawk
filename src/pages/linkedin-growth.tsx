import React, { useState } from 'react';
import { TrendingUp, FileText, Calendar } from 'lucide-react';
import LinkedInPostGenerator from '@/components/linkedin/LinkedInPostGenerator';
import LinkedInGrowthPlan from '@/components/linkedin/LinkedInGrowthPlan';
import PositioningGate from '@/components/positioning/PositioningGate';
import PositioningBanner from '@/components/positioning/PositioningBanner';
import AuthorityGapBanner from '@/components/icp/AuthorityGapBanner';

const TABS = [
  { id: 'plan', label: 'Growth Plan', icon: Calendar, description: 'AI-powered LinkedIn strategy' },
  { id: 'posts', label: 'Post Generator', icon: FileText, description: 'Viral posts in one click' },
];

export default function LinkedInGrowthPage() {
  const [activeTab, setActiveTab] = useState('plan');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <TrendingUp size={13} color="white" />
          </div>
          <span className="text-xs font-medium tag tag-green">LinkedIn Authority Building</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
          Grow Your Profile & Get Inbound Clients
        </h2>
        <p className="text-sm" style={{ color: '#475569' }}>
          AI growth plans + post generator → One-click post to LinkedIn with optimal keywords
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
                  background: isActive ? 'rgba(16,185,129,0.18)' : 'transparent',
                  color: isActive ? '#6ee7b7' : '#475569',
                  border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        <PositioningBanner />
        <AuthorityGapBanner onAct={() => setActiveTab('posts')} />
        <PositioningGate reason="Posts that don't speak to a specific ICP get scrolled past. Set positioning first.">
          {activeTab === 'plan' && <LinkedInGrowthPlan />}
          {activeTab === 'posts' && <LinkedInPostGenerator />}
        </PositioningGate>
      </div>
    </div>
  );
}
