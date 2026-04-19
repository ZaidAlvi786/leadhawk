import React, { useState } from 'react';
import { TrendingUp, FileText, Calendar, BarChart2 } from 'lucide-react';
import LinkedInPostGenerator from '@/components/linkedin/LinkedInPostGenerator';
import LinkedInGrowthPlan from '@/components/linkedin/LinkedInGrowthPlan';

const TABS = [
  { id: 'plan', label: 'Growth Plan', icon: Calendar, description: 'AI-powered LinkedIn strategy' },
  { id: 'posts', label: 'Post Generator', icon: FileText, description: 'Viral posts in one click' },
];

export default function LinkedInGrowthPage() {
  const [activeTab, setActiveTab] = useState('plan');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <TrendingUp size={13} color="white" />
              </div>
              <span className="text-xs font-medium tag tag-green">LinkedIn Monetization System</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
              Grow Your Profile & Get Inbound Clients
            </h2>
            <p className="text-sm" style={{ color: '#475569' }}>
              AI growth plans + viral post generator → One-click post to LinkedIn with optimal keywords
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {[
              { label: 'Avg Profile Views', value: '+340%', color: '#10b981' },
              { label: 'Engagement Rate', value: '8.2%', color: '#6366f1' },
              { label: 'Inbound Leads', value: '12/mo', color: '#06b6d4' },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-2.5 rounded-xl text-center" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div className="text-lg font-bold" style={{ color: stat.color, fontFamily: 'Syne' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: '#334155' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-8 py-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <div className="flex items-center gap-0">
          {[
            { n: '1', label: 'Generate Growth Plan', sub: 'AI-tailored strategy' },
            { n: '2', label: 'Follow Weekly Actions', sub: 'Post, connect, engage' },
            { n: '3', label: 'Create Viral Posts', sub: 'AI content generator' },
            { n: '4', label: 'Post with One Click', sub: 'Direct to LinkedIn' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white', fontFamily: 'Syne' }}>
                  {step.n}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>{step.label}</div>
                  <div className="text-xs" style={{ color: '#334155' }}>{step.sub}</div>
                </div>
              </div>
              {i < 3 && (
                <div className="flex-1 mx-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.3), rgba(6,182,212,0.1))' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-4 pb-0">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'plan' && <LinkedInGrowthPlan />}
        {activeTab === 'posts' && <LinkedInPostGenerator />}
      </div>
    </div>
  );
}
