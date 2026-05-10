import React, { useState } from 'react';
import { Wand2, Calendar, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { generateTwitterGrowthPlan } from '@/lib/ai';

export default function TwitterGrowthPlanGenerator() {
  const { twitterGrowthPlans, addTwitterGrowthPlan, userProfile, userPositioning } = useStore();
  const [form, setForm] = useState({
    currentFollowers: 100,
    targetFollowers: 1000,
    weekCount: 4,
  });
  const [generated, setGenerated] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result: any = await generateTwitterGrowthPlan({
        currentFollowers: form.currentFollowers,
        niche: userProfile.service,
        targetFollowers: form.targetFollowers,
        weekCount: form.weekCount,
        expertise: userProfile.skills,
        positioning: userPositioning,
      });
      if (result.error) {
        toast.error('Failed to generate plan. Check your API key.');
        console.error('Plan generation error:', result);
        return;
      }
      setGenerated(result);
      toast.success('Growth plan generated!');
    } catch (err) {
      toast.error('Failed to generate plan');
      console.error('Generation error:', err);
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!generated?.weeks) return;
    generated.weeks.forEach((week: any, index: number) => {
      addTwitterGrowthPlan({
        id: `plan_${Date.now()}_${index}`,
        week: week.week || index + 1,
        theme: week.theme || 'Week ' + (index + 1),
        goals: week.goals || [],
        actions: week.actions?.map((a: any) => ({
          id: Math.random().toString(36).slice(2),
          type: a.type || 'tweet',
          description: a.description || '',
          frequency: a.frequency || 'daily',
          priority: a.priority || 'medium',
          completed: false,
        })) || [],
        suggestedTopics: week.suggestedTopics || [],
        targetFollowers: form.targetFollowers,
        targetEngagementRate: 5,
      });
    });
    toast.success('Plan saved!');
    setGenerated(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} color="#06b6d4" />
          <h3 className="font-semibold text-sm" style={{ color: '#06b6d4', fontFamily: 'Syne' }}>
            Twitter Growth Plan
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Current Followers
            </label>
            <input
              type="number"
              className="input-field text-sm"
              value={form.currentFollowers}
              onChange={(e) => setForm({ ...form, currentFollowers: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Target Followers
            </label>
            <input
              type="number"
              className="input-field text-sm"
              value={form.targetFollowers}
              onChange={(e) => setForm({ ...form, targetFollowers: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Week Count
            </label>
            <select
              className="input-field text-sm"
              value={form.weekCount}
              onChange={(e) => setForm({ ...form, weekCount: parseInt(e.target.value) })}
            >
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>
        </div>

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {/* Generated Plan */}
      {generated && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
          {generated.overview && (
            <div className="mb-4">
              <p className="text-sm" style={{ color: '#cbd5e1' }}>{generated.overview}</p>
            </div>
          )}

          {generated.weeks && generated.weeks.length > 0 ? (
            <div className="space-y-4 mb-4">
              {generated.weeks.slice(0, 3).map((week: any, i: number) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} color="#06b6d4" />
                    <span className="text-xs font-bold" style={{ color: '#06b6d4' }}>Week {week.week || i + 1}</span>
                    <span className="text-xs" style={{ color: '#64748b' }}>{week.theme}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    {week.goals?.slice(0, 2).map((g: string, gi: number) => (
                      <p key={gi}>• {g}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)' }}>
              <p className="text-xs" style={{ color: '#fcd34d' }}>
                Plan generated! Check browser console for details. Click "Save Plan" to proceed.
              </p>
            </div>
          )}

          <button className="btn-primary w-full" onClick={handleSave}>
            Save Plan
          </button>
        </div>
      )}

      {/* Saved Plans */}
      {twitterGrowthPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b' }}>
            Saved Plans ({twitterGrowthPlans.length})
          </h3>
          <div className="space-y-2">
            {twitterGrowthPlans.slice(0, 5).map((plan) => (
              <div key={plan.id} className="glass-card p-3" style={{ border: '1px solid rgba(6,182,212,0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-300">Week {plan.week}: {plan.theme}</p>
                    <p className="text-xs text-gray-400">{plan.actions.length} actions • {plan.goals.length} goals</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                    {plan.targetFollowers.toLocaleString()} target
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
