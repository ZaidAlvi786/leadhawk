// This component exists because: messages that DON'T look AI-generated are
// the only ones that get replies in 2026. The 4-component structure (specific
// reference / pattern interrupt / earned right / low-friction ask) plus the
// send-readiness check make it visibly obvious when a generated message is
// going to underperform — at compose time, not after 50 silent sends.
//
// What changed in Phase 3:
// - Tone selector deleted (it was surface-level — structure beats tone).
// - Manual mode deleted (no message ships without research).
// - Output is the 4 labeled components, each editable, run through 5 checks.

import React, { useState } from 'react';
import { Wand2, Copy, Save, Trash2, MessageSquare, AlertTriangle, FileSearch } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTemplates } from '@/lib/useTemplates';
import { generateOutreachComponents } from '@/lib/ai';
import { runSendReadinessChecks, assembleComponents } from '@/lib/outreach';
import type { OutreachComponents } from '@/lib/types';
import OutreachComponentDisplay from '@/components/outreach/OutreachComponentDisplay';
import SendReadinessPanel from '@/components/outreach/SendReadinessPanel';
import toast from 'react-hot-toast';

export default function MessageTemplateGenerator() {
  const { userProfile, leadResearch, userPositioning, setCurrentPage } = useStore();
  const { templates, addTemplate, deleteTemplate, loading: templatesLoading } = useTemplates();
  const [selectedResearchId, setSelectedResearchId] = useState<string>('');
  const [components, setComponents] = useState<OutreachComponents | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const selectedResearch = selectedResearchId ? leadResearch.find((x) => x.id === selectedResearchId) : null;

  // Re-assemble if any individual component is edited
  const handleComponentsChange = (next: OutreachComponents) => {
    setComponents({
      ...next,
      assembledMessage: assembleComponents(next),
    });
  };

  const handleGenerate = async () => {
    if (!selectedResearch) {
      toast.error('Pick a research entry first');
      return;
    }
    if (selectedResearch.sources.length === 0) {
      toast.error('That research entry has no sources — add some first');
      return;
    }
    setLoading(true);
    try {
      const result = await generateOutreachComponents({
        leadName: selectedResearch.leadName,
        leadTitle: selectedResearch.leadRole,
        leadCompany: selectedResearch.leadCompany,
        research: selectedResearch,
        positioning: userPositioning,
        yourName: userProfile.name || 'your name',
      });
      setComponents(result);
      if (!result.specificReference) {
        toast.error('AI returned empty components — sources may be too thin');
      } else {
        toast.success('Components generated — review the 5 checks below');
      }
    } catch {
      toast.error('Generation failed — check API keys');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!components) return;
    navigator.clipboard.writeText(components.assembledMessage);
    toast.success('Copied — paste into LinkedIn / email');
  };

  const handleSave = async () => {
    if (!components || !components.assembledMessage) {
      toast.error('Generate components first');
      return;
    }
    try {
      await addTemplate({
        name: templateName || `${selectedResearch?.leadName || 'Outreach'} — ${new Date().toLocaleDateString()}`,
        body: components.assembledMessage,
        // Tone field is legacy — we no longer choose it. Default to 'professional'.
        tone: 'professional',
        targetRole: selectedResearch?.leadRole || '',
        industry: '',
        responseRate: 0,
      });
      toast.success('Template saved');
      setTemplateName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const report = components ? runSendReadinessChecks(components) : null;

  // No research available — show empty-state CTA pointing to the Research tab
  if (leadResearch.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg p-3" style={{
          background: 'rgba(58,143,163,0.06)',
          border: '1px solid rgba(58,143,163,0.18)',
        }}>
          <p className="text-xs leading-relaxed" style={{ color: '#1E6F70' }}>
            <strong>Messages need research first.</strong> The generator refuses to invent specifics about real people. Open the Research tab, paste 2–3 real artifacts about a lead, then come back here.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{
            background: 'rgba(58,143,163,0.12)',
            border: '1px solid rgba(58,143,163,0.22)',
          }}>
            <FileSearch size={20} color="#1E6F70" />
          </div>
          <p className="text-sm text-center mb-3" style={{ color: '#6E7F86' }}>
            No lead research yet
          </p>
          <p className="text-xs text-center max-w-md mb-4" style={{ color: '#6E7F86' }}>
            The 4-component message format requires a real reference grounded in something the prospect actually said or did.
          </p>
          <button
            onClick={() => {
              // Switch to research tab via the parent — for now, just notify
              toast('Open the "Lead Research" tab above', { icon: '👆' });
            }}
            className="btn-primary text-sm"
          >
            Add Lead Research
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discipline reminder */}
      <div className="rounded-lg p-3" style={{
        background: 'rgba(58,143,163,0.06)',
        border: '1px solid rgba(58,143,163,0.18)',
      }}>
        <p className="text-xs leading-relaxed" style={{ color: '#1E6F70' }}>
          <strong>Structure beats tone.</strong> Every message gets 4 components: a specific reference (cited from research), a pattern interrupt, an earned right, and a low-friction ask. The 5 checks below tell you when it's ready.
        </p>
      </div>

      {/* Generator setup */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} color="#1E6F70" />
          <h3 className="text-sm font-semibold" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>
            Outreach Composer
          </h3>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
            Pick lead research *
          </label>
          <select
            value={selectedResearchId}
            onChange={(e) => { setSelectedResearchId(e.target.value); setComponents(null); }}
            className="input-field text-sm w-full"
          >
            <option value="">— Select a researched lead —</option>
            {leadResearch.map((r) => (
              <option key={r.id} value={r.id}>
                {r.leadName} · {r.leadCompany || 'Unknown'} · {r.sources.length} src · {r.hooks.length} hook{r.hooks.length === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </div>

        {selectedResearch && (
          <div className="rounded-lg p-3 text-xs" style={{
            background: 'rgba(58,143,163,0.08)',
            border: '1px solid rgba(58,143,163,0.15)',
            color: '#D6CCB6',
          }}>
            <p className="font-semibold mb-1" style={{ color: '#1E6F70' }}>
              {selectedResearch.leadName}
              {selectedResearch.leadRole && ` · ${selectedResearch.leadRole}`}
              {selectedResearch.leadCompany && ` at ${selectedResearch.leadCompany}`}
            </p>
            <p>
              <strong>{selectedResearch.sources.length}</strong> source{selectedResearch.sources.length === 1 ? '' : 's'} available · {selectedResearch.hooks.length} pre-synthesised hook{selectedResearch.hooks.length === 1 ? '' : 's'}
            </p>
            {selectedResearch.sources.length === 0 && (
              <p className="mt-1" style={{ color: '#D08A3E' }}>
                ⚠ No sources — open Research tab and add at least one before generating
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedResearch || selectedResearch.sources.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Wand2 size={14} />}
          {loading ? 'Composing 4-part message…' : 'Generate Outreach Components'}
        </button>
      </div>

      {/* Output */}
      {components && (
        <div className="glass-card p-5 space-y-4" style={{ border: '1px solid rgba(30,111,112,0.2)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>
              Composition
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#6E7F86' }}
            >
              {editing ? 'Preview' : 'Edit components'}
            </button>
          </div>

          <OutreachComponentDisplay components={components} editable={editing} onChange={handleComponentsChange} />

          {/* Assembled preview */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: '#6E7F86' }}>Assembled message</p>
            <div className="text-sm p-3 rounded-lg whitespace-pre-wrap leading-relaxed" style={{
              background: 'rgba(30,111,112,0.04)',
              border: '1px solid rgba(30,111,112,0.12)',
              color: '#E6DCC8',
            }}>
              {components.assembledMessage}
            </div>
            <p className="text-xs mt-1" style={{ color: '#6E7F86' }}>
              {components.assembledMessage.length} chars
            </p>
          </div>

          {/* Send-readiness */}
          {report && <SendReadinessPanel report={report} />}

          {/* Override warning */}
          {report && report.passed < report.total && (
            <div className="flex items-start gap-2 text-xs" style={{ color: '#D08A3E' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                Some checks failed. You can copy anyway, but expect lower reply rates. Consider editing components above first.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input-field text-sm flex-1 min-w-32"
              placeholder="Template name (optional)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <button onClick={handleCopy} className="btn-primary text-sm flex items-center gap-1">
              <Copy size={12} /> Copy
            </button>
            <button onClick={handleSave} className="btn-secondary text-sm flex items-center gap-1">
              <Save size={12} /> Save template
            </button>
          </div>
        </div>
      )}

      {/* Saved templates */}
      {(templatesLoading || templates.length > 0) && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            Saved Templates {templatesLoading ? '(loading…)' : `(${templates.length})`}
          </h3>
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="glass-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center flex-wrap gap-2 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{t.name}</span>
                    {t.responseRate && t.responseRate > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: 'rgba(30,111,112,0.15)',
                        color: '#1E6F70',
                      }}>
                        {t.responseRate}% reply rate
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: '#6E7F86' }}>no data yet</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { navigator.clipboard.writeText(t.body); toast.success('Copied'); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(58,143,163,0.1)', border: '1px solid rgba(58,143,163,0.2)' }}>
                      <Copy size={12} color="#1E6F70" />
                    </button>
                    <button onClick={async () => {
                      try { await deleteTemplate(t.id); toast.success('Deleted'); }
                      catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
                    }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(176,67,42,0.1)', border: '1px solid rgba(176,67,42,0.2)' }}>
                      <Trash2 size={12} color="#CC6B4F" />
                    </button>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6E7F86' }}>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
