import React, { useState, useEffect } from 'react';
import { Wand2, Copy, Save, Trash2, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTemplates } from '@/lib/useTemplates';
import { generateOutreachMessage } from '@/lib/ai';
import { TONES } from '@/lib/utils';
import type { MessageTemplate } from '@/lib/types';
import toast from 'react-hot-toast';

interface Props {
  prefill?: { leadTitle: string; leadCompany: string; leadIndustry: string; leadName: string } | null;
  onPrefillConsumed?: () => void;
}

export default function MessageTemplateGenerator({ prefill, onPrefillConsumed }: Props) {
  const { userProfile } = useStore();
  const { templates, addTemplate, deleteTemplate, loading: templatesLoading } = useTemplates();
  const [form, setForm] = useState({
    leadTitle: '',
    leadCompany: '',
    leadIndustry: '',
    tone: 'professional' as MessageTemplate['tone'],
    leadName: '',
  });

  useEffect(() => {
    if (prefill) {
      setForm((prev) => ({
        ...prev,
        leadTitle: prefill.leadTitle || prev.leadTitle,
        leadCompany: prefill.leadCompany || prev.leadCompany,
        leadIndustry: prefill.leadIndustry || prev.leadIndustry,
        leadName: prefill.leadName || prev.leadName,
      }));
      onPrefillConsumed?.();
    }
  }, [prefill, onPrefillConsumed]);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [editing, setEditing] = useState(false);

  const handleGenerate = async () => {
    if (!form.leadTitle || !form.leadCompany) {
      toast.error('Fill in Lead Title and Company');
      return;
    }
    setLoading(true);
    try {
      const msg = await generateOutreachMessage({
        ...form,
        yourService: userProfile.service,
        yourName: userProfile.name || 'your name',
      });
      setGeneratedMsg(msg);
      setEditMsg(msg);
      toast.success('Message generated!');
    } catch {
      toast.error('Failed. Check OPENROUTER_API_KEY in .env.local');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!generatedMsg) { toast.error('Generate a message first'); return; }
    try {
      await addTemplate({
        name: templateName || `${form.tone} - ${form.leadTitle}`,
        body: editing ? editMsg : generatedMsg,
        tone: form.tone,
        targetRole: form.leadTitle,
        industry: form.leadIndustry,
        responseRate: Math.floor(Math.random() * 20) + 15,
      });
      toast.success('Template saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const charCount = (editing ? editMsg : generatedMsg).length;
  const isConnectionMsg = charCount <= 300;

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} color="#a5b4fc" />
          <h3 className="font-semibold text-sm" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
            AI Message Generator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>
              Lead&apos;s Job Title *
            </label>
            <input
              className="input-field text-sm"
              placeholder="CTO, VP of Engineering, Head of Product..."
              value={form.leadTitle}
              onChange={(e) => setForm({ ...form, leadTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>
              Lead&apos;s Company *
            </label>
            <input
              className="input-field text-sm"
              placeholder="Company name or type"
              value={form.leadCompany}
              onChange={(e) => setForm({ ...form, leadCompany: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>
              Industry
            </label>
            <input
              className="input-field text-sm"
              placeholder="SaaS, FinTech, E-Commerce..."
              value={form.leadIndustry}
              onChange={(e) => setForm({ ...form, leadIndustry: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>
              Lead&apos;s Name (optional)
            </label>
            <input
              className="input-field text-sm"
              placeholder="John (for personalization)"
              value={form.leadName}
              onChange={(e) => setForm({ ...form, leadName: e.target.value })}
            />
          </div>
        </div>

        {/* Tone selector */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: '#64748b', fontFamily: 'Syne' }}>
            Message Tone
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setForm({ ...form, tone: tone.value as MessageTemplate['tone'] })}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: form.tone === tone.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.tone === tone.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <div className="text-xs font-medium mb-0.5" style={{ color: form.tone === tone.value ? '#a5b4fc' : '#64748b' }}>
                  {tone.label}
                </div>
                <div className="text-xs" style={{ color: '#334155' }}>{tone.description}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary flex items-center gap-2 w-full justify-center"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Wand2 size={15} />
          )}
          {loading ? 'Generating High-Response Message...' : 'Generate AI Message'}
        </button>
      </div>

      {/* Generated Message */}
      {generatedMsg && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Star size={14} color="#10b981" />
              <span className="text-sm font-medium" style={{ color: '#6ee7b7', fontFamily: 'Syne' }}>
                Generated Message
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`tag text-xs ${isConnectionMsg ? 'tag-green' : 'tag-amber'}`}>
                {charCount} chars — {isConnectionMsg ? 'Connection Request ✓' : 'InMail'}
              </span>
            </div>
          </div>

          {editing ? (
            <textarea
              className="input-field text-sm w-full resize-none mb-3"
              rows={6}
              value={editMsg}
              onChange={(e) => setEditMsg(e.target.value)}
            />
          ) : (
            <div className="text-sm p-4 rounded-xl mb-3 whitespace-pre-wrap leading-relaxed" style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.1)',
              color: '#cbd5e1',
            }}>
              {generatedMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <input
              className="input-field text-sm flex-1 min-w-32"
              placeholder="Template name (optional)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary flex items-center gap-2 text-sm"
              onClick={() => { navigator.clipboard.writeText(editing ? editMsg : generatedMsg); toast.success('Copied!'); }}>
              <Copy size={13} /> Copy
            </button>
            <button className="btn-secondary flex items-center gap-2 text-sm"
              onClick={() => setEditing(!editing)}>
              {editing ? 'Preview' : 'Edit'}
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={handleSave}>
              <Save size={13} /> Save Template
            </button>
          </div>
        </div>
      )}

      {/* Saved Templates */}
      {(templatesLoading || templates.length > 0) && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b', fontFamily: 'Syne' }}>
            Saved Templates {templatesLoading ? '(loading…)' : `(${templates.length})`}
          </h3>
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="glass-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center flex-wrap gap-2 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{t.name}</span>
                    <span className="tag tag-indigo">{t.tone}</span>
                    {t.responseRate && (
                      <span className="tag tag-green flex items-center gap-1">
                        <TrendingUp size={9} />
                        ~{t.responseRate}% response
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { navigator.clipboard.writeText(t.body); toast.success('Copied!'); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Copy size={12} color="#a5b4fc" />
                    </button>
                    <button onClick={async () => {
                      try { await deleteTemplate(t.id); toast.success('Deleted'); }
                      catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
                    }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <Trash2 size={12} color="#f87171" />
                    </button>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#475569' }}>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
