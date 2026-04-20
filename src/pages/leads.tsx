import React, { useState, useCallback } from 'react';
import { Target, MessageSquare, Filter, Zap } from 'lucide-react';
import LeadFilterBuilder from '@/components/leads/LeadFilterBuilder';
import MessageTemplateGenerator from '@/components/leads/MessageTemplateGenerator';

export interface LeadPrefill {
  leadTitle: string;
  leadCompany: string;
  leadIndustry: string;
  leadName: string;
}

const TABS = [
  { id: 'filters', label: 'Filter Builder', icon: Filter, description: 'Build & save Sales Navigator filters' },
  { id: 'messages', label: 'Message Templates', icon: MessageSquare, description: 'AI outreach that gets responses' },
];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('filters');
  const [prefill, setPrefill] = useState<LeadPrefill | null>(null);

  const handleMessageForFilter = useCallback((data: LeadPrefill) => {
    setPrefill(data);
    setActiveTab('messages');
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero banner */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                <Target size={13} color="white" />
              </div>
              <span className="text-xs font-medium tag tag-indigo">Sales Navigator Integration</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
              Find & Convert Your Ideal Clients
            </h2>
            <p className="text-sm" style={{ color: '#475569' }}>
              Build precise filters → Open in Sales Navigator → Send AI-crafted messages that get replies
            </p>
          </div>

          {/* Stats row */}
          <div className="hidden lg:flex items-center gap-3">
            {[
              { label: 'Avg Response Rate', value: '23%', color: '#10b981' },
              { label: 'Time Saved', value: '4h/day', color: '#6366f1' },
              { label: 'Filter Accuracy', value: '94%', color: '#06b6d4' },
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

      {/* Workflow steps */}
      <div className="px-4 md:px-8 py-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-0">
          {[
            { n: '1', label: 'Describe Ideal Lead', sub: 'AI extracts filters' },
            { n: '2', label: 'Open Sales Navigator', sub: 'Filters pre-applied' },
            { n: '3', label: 'Generate Message', sub: 'Personalized outreach' },
            { n: '4', label: 'Send & Get Clients', sub: 'High response rate' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: 'white', fontFamily: 'Syne' }}>
                  {step.n}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>{step.label}</div>
                  <div className="text-xs" style={{ color: '#334155' }}>{step.sub}</div>
                </div>
              </div>
              {i < 3 && (
                <div className="hidden sm:block flex-1 mx-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(6,182,212,0.1))' }} />
              )}
            </React.Fragment>
          ))}
        </div>
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
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#475569',
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
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
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {activeTab === 'filters' && <LeadFilterBuilder onMessageForFilter={handleMessageForFilter} />}
        {activeTab === 'messages' && <MessageTemplateGenerator prefill={prefill} onPrefillConsumed={() => setPrefill(null)} />}
      </div>
    </div>
  );
}
