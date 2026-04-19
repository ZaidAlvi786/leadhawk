import React, { useState } from 'react';
import { Wand2, Target, TrendingUp, Calendar, CheckCircle, Circle, ChevronDown, ChevronRight, BarChart2, Zap, DollarSign } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateGrowthPlan } from '@/lib/ai';
import toast from 'react-hot-toast';

export default function LinkedInGrowthPlan() {
  const { userProfile, growthPlans, addGrowthPlan, activePlan, setActivePlan } = useStore();
  const [form, setForm] = useState({
    currentRole: userProfile.title,
    targetAudience: userProfile.targetAudience,
    mainSkills: userProfile.skills.join(', '),
    businessGoal: 'Get freelance clients and build thought leadership',
    weekCount: 4,
  });
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateGrowthPlan({
        ...form,
        mainSkills: form.mainSkills.split(',').map((s) => s.trim()),
      }) as Record<string, unknown>;
      setPlan(result);
      toast.success('Growth plan generated!');
    } catch {
      toast.error('Failed. Check your API key.');
    }
    setLoading(false);
  };

  const priorityColor = (p: string) => {
    if (p === 'high') return { bg: 'rgba(244,63,94,0.15)', color: '#fca5a5', border: 'rgba(244,63,94,0.3)' };
    if (p === 'medium') return { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' };
    return { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' };
  };

  const actionTypeIcon = (type: string) => {
    const icons: Record<string, string> = { post: '📝', engage: '💬', connect: '🤝', message: '✉️', comment: '💡' };
    return icons[type] || '•';
  };

  return (
    <div className="space-y-6">
      {/* Plan Generator */}
      <div className="glass-card p-5" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))',
        border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} color="#10b981" />
          <h3 className="font-semibold text-sm" style={{ color: '#6ee7b7', fontFamily: 'Syne' }}>
            AI LinkedIn Growth Plan Generator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Your Role / Title</label>
            <input className="input-field text-sm" value={form.currentRole}
              onChange={(e) => setForm({ ...form, currentRole: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Target Audience</label>
            <input className="input-field text-sm" placeholder="e.g. SaaS Founders, CTOs..."
              value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Your Skills (comma-separated)</label>
            <input className="input-field text-sm" value={form.mainSkills}
              onChange={(e) => setForm({ ...form, mainSkills: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Business Goal</label>
            <input className="input-field text-sm" value={form.businessGoal}
              onChange={(e) => setForm({ ...form, businessGoal: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Plan Duration</label>
            <div className="flex gap-2">
              {[4, 8, 12].map((w) => (
                <button
                  key={w}
                  onClick={() => setForm({ ...form, weekCount: w })}
                  className="flex-1 py-2 text-sm rounded-xl transition-all"
                  style={{
                    background: form.weekCount === w ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.weekCount === w ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: form.weekCount === w ? '#6ee7b7' : '#475569',
                  }}
                >
                  {w}w
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: '1px solid rgba(16,185,129,0.4)',
            boxShadow: loading ? 'none' : '0 0 20px rgba(16,185,129,0.3)',
          }}
        >
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Building Your Growth Strategy...' : `Generate ${form.weekCount}-Week Growth Plan`}
        </button>
      </div>

      {/* Generated Plan */}
      {plan && !('error' in plan) && (
        <div className="space-y-4 animate-fadeUp">
          {/* Overview */}
          {typeof plan.overview === 'string' && (
            <div className="glass-card p-5" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={15} color="#10b981" />
                <span className="text-sm font-medium" style={{ color: '#6ee7b7', fontFamily: 'Syne' }}>Plan Overview</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{plan.overview as string}</p>

              {/* Monetization tips */}
              {(plan.monetizationTips as string[])?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign size={13} color="#f59e0b" />
                    <span className="text-xs font-medium" style={{ color: '#fcd34d', fontFamily: 'Syne' }}>Monetization Tips</span>
                  </div>
                  <div className="space-y-1.5">
                    {(plan.monetizationTips as string[]).map((tip: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#94a3b8' }}>
                        <span style={{ color: '#f59e0b' }}>→</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weekly Plans */}
          {(plan.weeks as Record<string, unknown>[])?.map((week: Record<string, unknown>) => (
            <div key={week.week as number} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.week as number ? null : week.week as number)}
                className="w-full flex items-center justify-between p-4 text-left"
                style={{ borderBottom: expandedWeek === week.week ? '1px solid rgba(99,102,241,0.15)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.15))',
                    color: '#a5b4fc',
                    fontFamily: 'Syne',
                  }}>
                    W{week.week as number}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{week.theme as string}</div>
                    <div className="text-xs" style={{ color: '#475569' }}>{week.focus as string}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                    <span className="tag tag-indigo text-xs">{(week.targetConnections as number)?.toLocaleString()} connections</span>
                    <span className="tag tag-cyan text-xs">{(week.targetImpressions as number)?.toLocaleString()} impressions</span>
                  </div>
                  {expandedWeek === week.week ? <ChevronDown size={16} color="#475569" /> : <ChevronRight size={16} color="#475569" />}
                </div>
              </button>

              {expandedWeek === week.week && (
                <div className="p-4 space-y-4">
                  {/* Goals */}
                  {(week.goals as string[])?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: '#64748b', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Goals
                      </div>
                      <div className="space-y-1">
                        {(week.goals as string[]).map((goal: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                            <CheckCircle size={13} color="#10b981" />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(week.actions as Record<string, unknown>[])?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: '#64748b', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Daily Actions
                      </div>
                      <div className="space-y-2">
                        {(week.actions as Record<string, unknown>[]).map((action: Record<string, unknown>, i: number) => {
                          const colors = priorityColor(action.priority as string);
                          return (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-base">{actionTypeIcon(action.type as string)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm" style={{ color: '#e2e8f0' }}>{action.description as string}</div>
                                <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{action.frequency as string}</div>
                              </div>
                              <span className="tag text-xs px-2 py-0.5 flex-shrink-0"
                                style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                {action.priority as string}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Content Topics */}
                  {(week.contentTopics as string[])?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: '#64748b', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Content Topics This Week
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(week.contentTopics as string[]).map((topic: string, i: number) => (
                          <span key={i} className="tag tag-indigo text-xs">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Key Metrics */}
          {(plan.keyMetrics as string[])?.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} color="#6366f1" />
                <span className="text-sm font-medium" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>Track These Metrics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(plan.keyMetrics as string[]).map((metric: string, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg text-center text-xs" style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    color: '#94a3b8',
                  }}>
                    {metric}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
