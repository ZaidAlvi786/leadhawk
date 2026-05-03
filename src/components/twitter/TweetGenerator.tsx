import React, { useState } from 'react';
import { Wand2, Copy, Save, Trash2, Share2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { generateTweet } from '@/lib/ai';
import type { Tweet } from '@/lib/types';

const TWEET_TYPES = [
  { value: 'single', label: '1️⃣ Single Tweet', desc: 'One powerful tweet' },
  { value: 'thread-part', label: '🧵 Thread Starter', desc: 'First tweet of thread' },
  { value: 'reply', label: '💬 Reply', desc: 'Engage with others' },
];

const TONES = [
  { value: 'educational', label: 'Educational', desc: 'Teaching & insights' },
  { value: 'controversial', label: 'Controversial', desc: 'Hot takes & debate' },
  { value: 'humorous', label: 'Humorous', desc: 'Funny & entertaining' },
  { value: 'inspirational', label: 'Inspirational', desc: 'Motivation & wins' },
];

export default function TweetGenerator() {
  const { tweets, addTweet, deleteTweet, userProfile } = useStore();
  const [form, setForm] = useState({
    topic: '',
    threadType: 'single' as 'single' | 'thread-part' | 'reply',
    tone: 'educational' as 'educational' | 'controversial' | 'humorous' | 'inspirational',
    replyingTo: '',
  });
  const [generated, setGenerated] = useState<{ content: string; hook: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      toast.error('Enter a topic');
      return;
    }
    setLoading(true);
    try {
      const result = await generateTweet({
        topic: form.topic,
        threadType: form.threadType,
        replyingTo: form.replyingTo || undefined,
        yourExpertise: userProfile.skills,
        tone: form.tone,
      });
      setGenerated(result);
      setEditContent(result.content);
      toast.success('Tweet generated!');
    } catch {
      toast.error('Failed to generate tweet');
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!generated) return;
    const tweet: Tweet = {
      id: `tweet_${Date.now()}`,
      content: editing ? editContent : generated.content,
      hook: generated.hook,
      postType: form.threadType,
      estimatedEngagement: Math.floor(Math.random() * 100) + 10,
      createdAt: new Date().toISOString(),
    };
    addTweet(tweet);
    toast.success('Tweet saved!');
    setGenerated(null);
    setEditContent('');
    setForm({ topic: '', threadType: 'single', tone: 'educational', replyingTo: '' });
  };

  const charCount = (editing ? editContent : generated?.content || '').length;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} color="#06b6d4" />
          <h3 className="font-semibold text-sm" style={{ color: '#06b6d4', fontFamily: 'Syne' }}>
            Tweet Generator
          </h3>
        </div>

        <div className="space-y-4 mb-4">
          {/* Topic */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Topic or Hook
            </label>
            <textarea
              className="input-field w-full text-sm resize-none"
              rows={2}
              placeholder="What do you want to tweet about? Be specific..."
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>

          {/* Tweet Type */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Tweet Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TWEET_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, threadType: t.value as 'single' | 'thread-part' | 'reply' })}
                  className="p-3 rounded-lg text-left transition-all text-xs"
                  style={{
                    background: form.threadType === t.value ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.threadType === t.value ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: form.threadType === t.value ? '#06b6d4' : '#64748b',
                  }}
                >
                  <div className="font-medium">{t.label}</div>
                  <div style={{ color: '#475569' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
              Tone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setForm({ ...form, tone: tone.value as any })}
                  className="p-2.5 rounded-lg text-left transition-all text-xs"
                  style={{
                    background: form.tone === tone.value ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.tone === tone.value ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <div className="font-medium" style={{ color: form.tone === tone.value ? '#06b6d4' : '#a0aec0' }}>
                    {tone.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {form.threadType === 'reply' && (
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                Replying To (optional)
              </label>
              <input
                className="input-field text-sm w-full"
                placeholder="Paste the tweet you're replying to..."
                value={form.replyingTo}
                onChange={(e) => setForm({ ...form, replyingTo: e.target.value })}
              />
            </div>
          )}
        </div>

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Generating...' : 'Generate Tweet'}
        </button>
      </div>

      {/* Generated Tweet */}
      {generated && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} color="#06b6d4" />
              <span className="text-sm font-medium" style={{ color: '#06b6d4' }}>
                Generated Tweet
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${charCount > 280 ? 'text-red-400' : 'text-green-400'}`}>
              {charCount}/280
            </span>
          </div>

          {editing ? (
            <textarea
              className="input-field text-sm w-full resize-none mb-3"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.substring(0, 280))}
            />
          ) : (
            <div className="text-sm p-4 rounded-lg mb-3 whitespace-pre-wrap leading-relaxed" style={{
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.1)',
              color: '#cbd5e1',
            }}>
              {generated.content}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2"
              onClick={() => { navigator.clipboard.writeText(editing ? editContent : generated.content); toast.success('Copied!'); }}>
              <Copy size={13} /> Copy
            </button>
            <button className="btn-secondary text-sm flex items-center gap-2"
              onClick={() => setEditing(!editing)}>
              {editing ? 'Preview' : 'Edit'}
            </button>
            <button className="btn-primary text-sm flex items-center gap-2" onClick={handleSave}>
              <Save size={13} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Saved Tweets */}
      {tweets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b' }}>
            Saved Tweets ({tweets.length})
          </h3>
          <div className="space-y-2">
            {tweets.map((tweet) => (
              <div key={tweet.id} className="glass-card p-3" style={{ border: '1px solid rgba(6,182,212,0.1)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm text-gray-300 flex-1">{tweet.content}</p>
                  <button
                    onClick={() => { deleteTweet(tweet.id); toast.success('Deleted'); }}
                    className="p-1.5"
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px' }}
                  >
                    <Trash2 size={12} color="#f87171" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: '#64748b' }}>
                  <span>{tweet.postType}</span>
                  <span>~{tweet.estimatedEngagement} engagement</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
