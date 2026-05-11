import React, { useState } from 'react';
import { Target, MessageSquare, Filter, Sparkles, MessageCircle } from 'lucide-react';
import LeadFilterBuilder from '@/components/leads/LeadFilterBuilder';
import MessageTemplateGenerator from '@/components/leads/MessageTemplateGenerator';
import LeadResearchPanel from '@/components/leads/LeadResearchPanel';
import ReplyCoach from '@/components/reply/ReplyCoach';
import PositioningGate from '@/components/positioning/PositioningGate';
import PositioningBanner from '@/components/positioning/PositioningBanner';

const TABS = [
  { id: 'filters',  label: 'Filter Builder',     icon: Filter,         description: 'Build & save Sales Navigator filters' },
  { id: 'research', label: 'Lead Research',      icon: Sparkles,       description: 'Paste real artifacts → grounded hooks' },
  { id: 'messages', label: 'Outreach Composer',  icon: MessageSquare,  description: '4-part messages with send-readiness check' },
  { id: 'replies',  label: 'Reply Coach',        icon: MessageCircle,  description: 'Classify replies → 2–3 strategic options' },
];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('filters');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3A8FA3, #1E6F70)' }}>
            <Target size={13} color="white" />
          </div>
          <span className="text-xs font-medium tag tag-indigo">Sales Navigator Integration</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
          Find & Convert Your Ideal Clients
        </h2>
        <p className="text-sm" style={{ color: '#6E7F86' }}>
          Filters → Research → Outreach (4-part structure with send-readiness) → Reply coach when they respond
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
                title={tab.description}
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
        <PositioningGate reason="Lead messages have to land at one specific ICP. Set positioning first.">
          {activeTab === 'filters' && <LeadFilterBuilder />}
          {activeTab === 'research' && <LeadResearchPanel />}
          {activeTab === 'messages' && <MessageTemplateGenerator />}
          {activeTab === 'replies' && <ReplyCoach />}
        </PositioningGate>
      </div>
    </div>
  );
}
