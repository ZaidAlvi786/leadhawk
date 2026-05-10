// This component exists because: 80% of beginners fumble the moment a real
// prospect replies. The brief is explicit — give the user 2-3 strategic
// options for the next move with their tradeoffs, never one canned response,
// because the right move depends on context the AI can't fully see.

import React, { useState } from 'react';
import { MessageCircle, Wand2, Copy, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { analyzeReply } from '@/lib/ai';
import { REPLY_CLASS_LABELS, runSendReadinessChecks, assembleComponents } from '@/lib/outreach';
import type { ReplyAnalysis, OutreachComponents } from '@/lib/types';
import SendReadinessPanel from '@/components/outreach/SendReadinessPanel';

const TONE_STYLES = {
  good:    { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  warn:    { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  bad:     { bg: 'rgba(239,68,68,0.12)',  color: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  neutral: { bg: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: 'rgba(148,163,184,0.25)' },
} as const;

export default function ReplyCoach() {
  const { userPositioning } = useStore();
  const [form, setForm] = useState({ leadName: '', leadRole: '', leadCompany: '', originalMessage: '', prospectReply: '' });
  const [analysis, setAnalysis] = useState<ReplyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!form.prospectReply.trim()) {
      toast.error('Paste the prospect reply first');
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeReply({
        prospectReply: form.prospectReply,
        leadName: form.leadName || undefined,
        leadRole: form.leadRole || undefined,
        leadCompany: form.leadCompany || undefined,
        originalMessage: form.originalMessage || undefined,
        positioning: userPositioning,
      });
      setAnalysis(result);
      if (result.playbook.length === 0) {
        toast.error('No playbook returned — try again');
      } else {
        toast.success(`${result.playbook.length} option${result.playbook.length === 1 ? '' : 's'} ready`);
      }
    } catch {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const classMeta = analysis ? REPLY_CLASS_LABELS[analysis.classification] : null;
  const classStyle = classMeta ? TONE_STYLES[classMeta.tone] : TONE_STYLES.neutral;

  return (
    <div className="space-y-6">
      {/* Discipline reminder */}
      <div className="rounded-lg p-3" style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.18)',
      }}>
        <p className="text-xs leading-relaxed" style={{ color: '#a5b4fc' }}>
          <strong>Two minutes here saves the deal.</strong> Most beginners reply on autopilot. Paste their reply — the coach gives you 2–3 options with tradeoffs so you pick on purpose.
        </p>
      </div>

      {/* Input form */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
          Reply Coach
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="input-field text-sm"
            placeholder="Lead name (optional)"
            value={form.leadName}
            onChange={(e) => setForm({ ...form, leadName: e.target.value })}
          />
          <input
            className="input-field text-sm"
            placeholder="Role"
            value={form.leadRole}
            onChange={(e) => setForm({ ...form, leadRole: e.target.value })}
          />
          <input
            className="input-field text-sm"
            placeholder="Company"
            value={form.leadCompany}
            onChange={(e) => setForm({ ...form, leadCompany: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#94a3b8' }}>
            Original message you sent (optional but helpful)
          </label>
          <textarea
            rows={3}
            className="input-field text-sm w-full resize-none"
            placeholder="Paste the message you sent that they replied to…"
            value={form.originalMessage}
            onChange={(e) => setForm({ ...form, originalMessage: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#94a3b8' }}>
            Their reply *
          </label>
          <textarea
            rows={4}
            className="input-field text-sm w-full resize-none"
            placeholder="Paste their reply verbatim. Even one-word replies count — they classify too."
            value={form.prospectReply}
            onChange={(e) => setForm({ ...form, prospectReply: e.target.value })}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !form.prospectReply.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Wand2 size={14} />}
          {loading ? 'Analyzing…' : 'Classify + Get Options'}
        </button>
      </div>

      {/* Analysis output */}
      {analysis && (
        <div className="space-y-3">
          {/* Classification */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle size={14} color="#a5b4fc" />
                <span className="text-xs font-semibold" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
                  Classification
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                  background: classStyle.bg,
                  color: classStyle.color,
                  border: `1px solid ${classStyle.border}`,
                }}>
                  {classMeta?.label}
                </span>
              </div>
              <span className="text-xs" style={{ color: '#64748b' }}>
                {Math.round(analysis.confidence * 100)}% confidence
              </span>
            </div>
            {analysis.reasoning && (
              <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                {analysis.reasoning}
              </p>
            )}
          </div>

          {/* Playbook options */}
          {analysis.playbook.map((option, i) => (
            <PlaybookCard key={i} option={option} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Each playbook option gets its own card with the example message run through
// the same send-readiness checks as outbound messages — because the same rules
// that make a cold DM work also make a reply message work.
// -----------------------------------------------------------------------------

function PlaybookCard({ option, idx }: { option: { label: string; approach: string; exampleMessage: string; tradeoff: string }; idx: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.exampleMessage);

  // Synthesize a fake OutreachComponents to reuse the checker. The "specific
  // reference" check requires a source ID, which a reply doesn't have — so
  // we add a stub source ID so that check is bypassed (it's not relevant for
  // mid-conversation replies).
  const fakeComponents: OutreachComponents = {
    specificReference: 'reply-context',
    patternInterrupt: '',
    earnedRight: '',
    lowFrictionAsk: draft, // run the CTA check against the whole reply
    sourceFieldIds: ['reply'],
    assembledMessage: assembleComponents({
      specificReference: '',
      patternInterrupt: draft,
      earnedRight: '',
      lowFrictionAsk: '',
    }),
  };
  const report = runSendReadinessChecks(fakeComponents);
  // Suppress the source-reference check for replies (it's not applicable)
  const filteredReport = {
    ...report,
    hasSpecificReference: { ok: true },
    passed: report.passed + (report.hasSpecificReference.ok ? 0 : 1),
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
          background: 'rgba(99,102,241,0.18)',
          color: '#a5b4fc',
        }}>{idx + 1}</span>
        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>
          {option.label}
        </span>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
        <strong style={{ color: '#94a3b8' }}>Approach: </strong>
        {option.approach}
      </p>

      {option.tradeoff && (
        <p className="text-xs leading-relaxed" style={{ color: '#fcd34d' }}>
          <strong>Tradeoff: </strong>{option.tradeoff}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Sample reply</span>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b' }}
          >
            {editing ? 'Preview' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <textarea
            rows={3}
            className="input-field text-sm w-full resize-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <div className="text-sm p-3 rounded-lg whitespace-pre-wrap" style={{
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.12)',
            color: '#e2e8f0',
          }}>
            {draft}
          </div>
        )}
      </div>

      <SendReadinessPanel report={filteredReport} />

      <div className="flex gap-2">
        <button
          onClick={() => { navigator.clipboard.writeText(draft); toast.success('Copied'); }}
          className="btn-primary text-xs flex items-center gap-1"
        >
          <Copy size={11} />
          Copy reply
        </button>
        <button
          onClick={() => setEditing(true)}
          className="btn-secondary text-xs flex items-center gap-1"
        >
          <ChevronRight size={11} />
          Adapt
        </button>
      </div>
    </div>
  );
}
