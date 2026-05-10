import React, { useState } from 'react';
import { Wand2, Copy, Save, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { generateTwitterThread } from '@/lib/ai';
import { primaryIcpLabel } from '@/lib/icp';
import type { TwitterThread } from '@/lib/types';
import IcpTagPicker from '@/components/icp/IcpTagPicker';

const THREAD_TYPES = [
  { value: 'educational', label: '📚 Educational', desc: 'Teach a concept' },
  { value: 'story', label: '📖 Story', desc: 'Personal journey' },
  { value: 'tips', label: '✅ Tips', desc: 'Actionable advice' },
  { value: 'debate', label: '🔥 Debate', desc: 'Controversial take' },
  { value: 'thread', label: '🧵 Thread', desc: 'General narrative' },
];

export default function TwitterThreadBuilder() {
  const { twitterThreads, addTwitterThread, deleteTwitterThread, userProfile, userPositioning } = useStore();
  const [form, setForm] = useState<{
    topic: string;
    threadType: TwitterThread['threadType'];
    icpTag: string | undefined;
  }>({
    topic: '',
    threadType: 'educational',
    icpTag: primaryIcpLabel(userPositioning),
  });
  const [generated, setGenerated] = useState<{ hook: string; setup: string[]; insights: string[]; cta: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      toast.error('Enter a topic');
      return;
    }
    setLoading(true);
    try {
      const result = await generateTwitterThread({
        topic: form.topic,
        threadType: form.threadType,
        yourSkills: userProfile.skills,
        targetAudience: userProfile.targetAudience,
        positioning: userPositioning,
      });
      setGenerated(result);
      toast.success('Thread generated!');
    } catch {
      toast.error('Failed to generate thread');
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!generated) return;
    const thread: TwitterThread = {
      id: `thread_${Date.now()}`,
      hook: generated.hook,
      setup: generated.setup,
      insights: generated.insights,
      cta: generated.cta,
      threadType: form.threadType,
      icpTag: form.icpTag,
      // Real reach comes from X analytics post-publish. Phase 5 will track it.
      estimatedReach: 0,
      createdAt: new Date().toISOString(),
    };
    addTwitterThread(thread);
    toast.success('Thread saved!');
    setGenerated(null);
    setForm({ topic: '', threadType: 'educational', icpTag: form.icpTag });
  };

  const fullThread = generated
    ? [generated.hook, ...generated.setup, ...generated.insights, generated.cta]
    : [];

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} color="#06b6d4" />
          <h3 className="font-semibold text-sm" style={{ color: '#06b6d4', fontFamily: 'Syne' }}>
            Thread Builder
          </h3>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Thread Topic
            </label>
            <textarea
              className="input-field w-full text-sm resize-none"
              rows={2}
              placeholder="What's your thread about?"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Thread Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {THREAD_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, threadType: t.value as TwitterThread['threadType'] })}
                  className="p-2 rounded-lg text-left transition-all text-xs"
                  style={{
                    background: form.threadType === t.value ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.threadType === t.value ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <div className="font-medium" style={{ color: form.threadType === t.value ? '#06b6d4' : '#64748b', fontSize: '11px' }}>
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ICP tag — Phase 4 */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Target ICP
            </label>
            <IcpTagPicker
              value={form.icpTag}
              onChange={(tag) => setForm({ ...form, icpTag: tag })}
            />
          </div>
        </div>

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Generating...' : 'Generate Thread'}
        </button>
      </div>

      {/* Generated Thread */}
      {generated && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: '#06b6d4' }}>
              🧵 {fullThread.length} Tweets
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {fullThread.map((tweet, i) => (
              <div key={i} className="p-3 rounded-lg text-sm" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)', color: '#cbd5e1' }}>
                <span className="text-xs font-bold" style={{ color: '#06b6d4' }}>{i + 1}/</span> {tweet}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2"
              onClick={() => {
                const threadText = fullThread.map((t, i) => `${i + 1}/ ${t}`).join('\n\n');
                navigator.clipboard.writeText(threadText);
                toast.success('Thread copied!');
              }}>
              <Copy size={13} /> Copy All
            </button>
            <button className="btn-primary text-sm flex items-center gap-2" onClick={handleSave}>
              <Save size={13} /> Save Thread
            </button>
          </div>
        </div>
      )}

      {/* Saved Threads */}
      {twitterThreads.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b' }}>
            Saved Threads ({twitterThreads.length})
          </h3>
          <div className="space-y-2">
            {twitterThreads.map((thread) => (
              <div key={thread.id} className="glass-card p-3" style={{ border: '1px solid rgba(6,182,212,0.1)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-300 mb-1">{thread.hook}</p>
                    <p className="text-xs text-gray-400">{thread.setup.length + thread.insights.length + 2} tweets • {thread.threadType}</p>
                  </div>
                  <button
                    onClick={() => { deleteTwitterThread(thread.id); toast.success('Deleted'); }}
                    className="p-1.5 flex-shrink-0"
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px' }}
                  >
                    <Trash2 size={12} color="#f87171" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
