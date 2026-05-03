import React from 'react';
import { BarChart3, TrendingUp, MessageSquare, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function AnalyticsPage() {
  const { outcomes, posts, twitterThreads, sequences } = useStore();

  const totalSent = outcomes.filter((o) => o.status !== 'no_response' && o.status !== 'closed_lost').length;
  const replied = outcomes.filter((o) => o.status === 'replied' || o.status === 'meeting_booked' || o.status === 'closed_won').length;
  const replyRate = totalSent > 0 ? ((replied / totalSent) * 100).toFixed(1) : '0';
  const meetings = outcomes.filter((o) => o.status === 'meeting_booked').length;
  const closed = outcomes.filter((o) => o.status === 'closed_won').length;

  const byChannel = {
    linkedin: outcomes.filter((o) => o.channel === 'linkedin').length,
    email: outcomes.filter((o) => o.channel === 'email').length,
    twitter: outcomes.filter((o) => o.channel === 'twitter').length,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={18} color="#6366f1" />
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Syne' }}>
            Analytics & Performance
          </h2>
        </div>
        <p className="text-sm" style={{ color: '#475569' }}>
          Track message performance, response rates, and outcomes across all channels
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sent', value: totalSent, icon: MessageSquare, color: '#6366f1' },
              { label: 'Replies', value: replied, icon: CheckCircle, color: '#10b981' },
              { label: 'Reply Rate', value: `${replyRate}%`, icon: TrendingUp, color: '#06b6d4' },
              { label: 'Meetings', value: meetings, icon: CheckCircle, color: '#f59e0b' },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="glass-card p-4" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} color={kpi.color} />
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {kpi.label}
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'Syne' }}>
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* By Channel */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#a5b4fc' }}>
              Outcomes by Channel
            </h3>
            <div className="space-y-3">
              {[
                { name: 'LinkedIn', value: byChannel.linkedin, color: '#06b6d4' },
                { name: 'Email', value: byChannel.email, color: '#6366f1' },
                { name: 'Twitter', value: byChannel.twitter, color: '#10b981' },
              ].map((ch) => (
                <div key={ch.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#a0aec0' }}>
                      {ch.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: ch.color }}>
                      {ch.value}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: ch.color,
                        width: `${totalSent > 0 ? (ch.value / totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs" style={{ color: '#64748b' }}>
                Generated Posts
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#6366f1' }}>
                {posts.length + twitterThreads.length}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs" style={{ color: '#64748b' }}>
                Email Sequences
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#10b981' }}>
                {sequences.length}
              </p>
            </div>
          </div>

          {/* Recent Outcomes */}
          {outcomes.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5b4fc' }}>
                Recent Outcomes
              </h3>
              <div className="space-y-2">
                {outcomes.slice(0, 5).map((outcome) => (
                  <div key={outcome.id} className="p-2 rounded text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{outcome.leadName}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: outcome.status === 'replied' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                          color: outcome.status === 'replied' ? '#10b981' : '#a5b4fc',
                        }}
                      >
                        {outcome.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{outcome.channel} • {new Date(outcome.sentAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
