import React, { useState } from 'react';
import { Plus, Trash2, Copy, Zap, Edit2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MessageTemplate } from '@/lib/types';

type ToneType = 'professional' | 'casual' | 'value-driven' | 'problem-solving';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    tone: 'professional' as ToneType,
    targetRole: '',
    industry: '',
  });

  const handleAdd = () => {
    if (!form.name || !form.body) {
      toast.error('Name and body are required');
      return;
    }

    const template: MessageTemplate = {
      id: editingId || `template_${Date.now()}`,
      ...form,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      setTemplates(templates.map((t) => (t.id === editingId ? template : t)));
      setEditingId(null);
      toast.success('Template updated!');
    } else {
      setTemplates([template, ...templates]);
      toast.success('Template created!');
    }

    setForm({ name: '', subject: '', body: '', tone: 'professional' as ToneType, targetRole: '', industry: '' });
    setShowForm(false);
  };

  const handleEdit = (template: MessageTemplate) => {
    setForm({
      name: template.name,
      subject: template.subject || '',
      body: template.body,
      tone: template.tone,
      targetRole: template.targetRole,
      industry: template.industry,
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success('Template deleted');
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard!');
  };

  const avgResponseRate = templates.length > 0
    ? (templates.reduce((sum, t) => sum + (t.responseRate || 0), 0) / templates.length).toFixed(1)
    : '0';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} color="#6366f1" />
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                Message Templates
              </h2>
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>
              Create reusable templates for email, LinkedIn, and Twitter
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(true); setEditingId(null); }}>
            <Plus size={14} />
            New Template
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} color="#6366f1" />
                <p className="text-xs" style={{ color: '#64748b' }}>Total Templates</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#6366f1', fontFamily: 'Syne' }}>
                {templates.length}
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} color="#10b981" />
                <p className="text-xs" style={{ color: '#64748b' }}>Avg Response</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: 'Syne' }}>
                {avgResponseRate}%
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} color="#06b6d4" />
                <p className="text-xs" style={{ color: '#64748b' }}>Avg Open Rate</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#06b6d4', fontFamily: 'Syne' }}>
                42%
              </p>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#a5b4fc' }}>
                {editingId ? 'Edit Template' : 'Create New Template'}
              </h3>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                    Template Name *
                  </label>
                  <input
                    className="input-field w-full text-sm"
                    placeholder="e.g., CEO Cold Email"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                      Target Role
                    </label>
                    <input
                      className="input-field w-full text-sm"
                      placeholder="CEO, VP Sales, etc."
                      value={form.targetRole}
                      onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                      Industry
                    </label>
                    <input
                      className="input-field w-full text-sm"
                      placeholder="SaaS, Finance, etc."
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                    Email Subject (optional)
                  </label>
                  <input
                    className="input-field w-full text-sm"
                    placeholder="Subject line"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                    Message Body *
                  </label>
                  <textarea
                    className="input-field w-full text-sm resize-none"
                    rows={5}
                    placeholder="Your message template. Use {name}, {company}, {role} for personalization"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                  <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                    💡 Tip: Use {'{name}'}, {'{company}'}, {'{role}'} for dynamic personalization
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b' }}>
                    Tone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['professional', 'casual', 'value-driven', 'problem-solving'] as ToneType[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setForm({ ...form, tone: tone as ToneType })}
                        className="p-2 rounded-lg text-left transition-all text-xs"
                        style={{
                          background: form.tone === tone ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.tone === tone ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: form.tone === tone ? '#a5b4fc' : '#64748b',
                        }}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  Cancel
                </button>
                <button className="btn-primary flex-1 text-sm" onClick={handleAdd}>
                  {editingId ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          )}

          {/* Templates List */}
          {templates.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Zap size={28} color="#6366f1" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Syne' }}>
                No Templates Yet
              </h3>
              <p className="text-sm text-center max-w-md" style={{ color: '#475569' }}>
                Create your first template to save time on outreach and improve consistency across campaigns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template) => (
                <div key={template.id} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{template.name}</h4>
                        <span className="tag text-xs" style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {template.tone}
                        </span>
                        {template.responseRate && (
                          <span className="text-xs" style={{ color: '#10b981', fontWeight: 600 }}>
                            {template.responseRate}% response
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                        {template.targetRole && <span>{template.targetRole}</span>}
                        {template.targetRole && template.industry && <span>•</span>}
                        {template.industry && <span>{template.industry}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(template)} className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }} title="Edit">
                        <Edit2 size={12} color="#a5b4fc" />
                      </button>
                      <button onClick={() => handleCopy(template.body)} className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }} title="Copy">
                        <Copy size={12} color="#a5b4fc" />
                      </button>
                      <button onClick={() => handleDelete(template.id)} className="p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)' }} title="Delete">
                        <Trash2 size={12} color="#f87171" />
                      </button>
                    </div>
                  </div>

                  {template.subject && (
                    <div className="mb-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#64748b' }}>Subject:</p>
                      <p className="text-xs text-white">{template.subject}</p>
                    </div>
                  )}

                  <div className="p-2 rounded text-xs whitespace-pre-wrap leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                    {template.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
