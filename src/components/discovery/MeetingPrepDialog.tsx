// This component exists because: the discovery-call → debrief → proposal
// chain is where freelancers/consultants actually win or lose deals.
// Wing-it calls and proposals-from-memory are the #1 close-rate killer.
// This dialog turns the chain into a 3-step ritual: prep brief (auto on
// open), debrief form (BANT-style), proposal generator (consumes debrief).
// Everything attaches to the lead — no orphan artifacts.

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Wand2, Mic, FileText, Briefcase, Copy, ArrowRight, Check, Clock,
  AlertCircle, Sparkles, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { generateDiscoveryBrief, generateProposal } from '@/lib/ai';
import { signalsForLead } from '@/lib/intent';
import {
  bantScore, bantVerdict, pillarStatus, isDebriefReady,
  assembleProposalMarkdown, BANT_LABELS, type BantPillar,
} from '@/lib/discovery';
import type { PipelineLead, CallDebrief, Proposal } from '@/lib/types';

type Step = 'prep' | 'debrief' | 'proposal';

interface Props {
  lead: PipelineLead;
  onClose: () => void;
}

export default function MeetingPrepDialog({ lead, onClose }: Props) {
  const {
    updatePipelineLead, leadResearch, intentSignals, userPositioning,
  } = useStore();

  const [step, setStep] = useState<Step>(() => {
    if (lead.proposal) return 'proposal';
    if (lead.callDebrief) return 'debrief';
    return 'prep';
  });
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const research = useMemo(
    () => leadResearch.find((r) => r.leadName === fullName),
    [leadResearch, fullName]
  );
  const signals = useMemo(() => signalsForLead(intentSignals, lead.id), [intentSignals, lead.id]);

  // Auto-generate brief on first open if it doesn't exist yet
  useEffect(() => {
    if (!lead.discoveryBrief && step === 'prep' && !generatingBrief) {
      handleGenerateBrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    try {
      const brief = await generateDiscoveryBrief({
        leadName: fullName,
        leadCompany: lead.company,
        leadRole: lead.title,
        research,
        signals,
        positioning: userPositioning,
      });
      updatePipelineLead(lead.id, { discoveryBrief: brief });
      toast.success(brief.discoveryQuestions.length > 0
        ? `Brief ready — ${brief.discoveryQuestions.length} questions, ${brief.likelyObjections.length} objections`
        : 'Brief generated but thin — paste research first for sharper output');
    } catch {
      toast.error('Brief generation failed');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleSaveDebrief = (debrief: CallDebrief) => {
    updatePipelineLead(lead.id, { callDebrief: debrief });
    toast.success('Debrief saved');
    setStep('proposal');
  };

  const handleGenerateProposal = async () => {
    if (!lead.callDebrief) return;
    setGeneratingProposal(true);
    try {
      const proposal = await generateProposal({
        leadName: fullName,
        leadCompany: lead.company,
        leadRole: lead.title,
        debrief: lead.callDebrief,
        positioning: userPositioning,
        proposedAmount: lead.proposalAmount,
      });
      updatePipelineLead(lead.id, { proposal });
      toast.success('Proposal ready — copy below');
    } catch {
      toast.error('Proposal generation failed');
    } finally {
      setGeneratingProposal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      background: 'rgba(15,59,71,0.55)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{
        background: 'linear-gradient(180deg, #F7F2E7 0%, #F2EBDD 100%)',
        border: '1px solid rgba(58,143,163,0.3)',
        boxShadow: '0 0 80px rgba(58,143,163,0.15)',
      }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: '#0F3B47', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X size={14} color="#6E7F86" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(58,143,163,0.12)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #D08A3E, #B0432A)',
          }}>
            <Mic size={18} color="white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'Syne' }}>
              Meeting Prep · {fullName}
            </h2>
            <p className="text-xs" style={{ color: '#6E7F86' }}>
              {lead.company}{lead.title ? ` · ${lead.title}` : ''}
            </p>
          </div>
        </div>

        {/* Step nav */}
        <div className="px-6 py-3 flex items-center gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {([
            { id: 'prep' as Step,     label: 'Pre-call brief',  icon: Wand2,    done: !!lead.discoveryBrief },
            { id: 'debrief' as Step,  label: 'Post-call debrief', icon: FileText, done: !!lead.callDebrief },
            { id: 'proposal' as Step, label: 'Proposal',         icon: Briefcase, done: !!lead.proposal },
          ]).map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => setStep(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: isActive ? 'rgba(58,143,163,0.18)' : s.done ? 'rgba(30,111,112,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(58,143,163,0.4)' : s.done ? 'rgba(30,111,112,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    color: isActive ? '#1E6F70' : s.done ? '#1E6F70' : '#6E7F86',
                  }}
                >
                  {s.done && !isActive ? <Check size={11} /> : <Icon size={11} />}
                  {s.label}
                </button>
                {i < 2 && <ArrowRight size={11} color="#6E7F86" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'prep' && (
            <PrepSection
              lead={lead}
              loading={generatingBrief}
              onRegenerate={handleGenerateBrief}
              hasResearch={!!research}
              hasSignals={signals.length > 0}
            />
          )}
          {step === 'debrief' && (
            <DebriefSection
              lead={lead}
              onSave={handleSaveDebrief}
            />
          )}
          {step === 'proposal' && (
            <ProposalSection
              lead={lead}
              loading={generatingProposal}
              onGenerate={handleGenerateProposal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Prep section — shows the discovery brief
// -----------------------------------------------------------------------------

function PrepSection({ lead, loading, onRegenerate, hasResearch, hasSignals }: {
  lead: PipelineLead; loading: boolean; onRegenerate: () => void;
  hasResearch: boolean; hasSignals: boolean;
}) {
  const brief = lead.discoveryBrief;

  if (!hasResearch && !hasSignals) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg p-3 flex items-start gap-2" style={{
          background: 'rgba(208,138,62,0.06)',
          border: '1px solid rgba(208,138,62,0.22)',
        }}>
          <AlertCircle size={13} color="#D08A3E" className="flex-shrink-0 mt-0.5" />
          <div className="text-xs" style={{ color: '#D08A3E' }}>
            <strong>Thin sources.</strong> No research or intent signals are attached to this lead. The AI will produce a generic brief — paste real artifacts on the lead first for a sharper one.
          </div>
        </div>
        <button onClick={onRegenerate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Wand2 size={14} />}
          {loading ? 'Generating…' : 'Generate generic brief anyway'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <p className="ml-3 text-sm" style={{ color: '#6E7F86' }}>Composing pre-call brief…</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <button onClick={onRegenerate} className="btn-primary w-full flex items-center justify-center gap-2">
        <Wand2 size={14} /> Generate brief
      </button>
    );
  }

  const totalMin = brief.callStructure.reduce((s, p) => s + p.minutes, 0);

  return (
    <div className="space-y-5">
      {/* Top priorities */}
      <Section icon={<Sparkles size={13} color="#1E6F70" />} title="Top priorities" color="#1E6F70">
        {brief.topPriorities.length === 0
          ? <p className="text-xs" style={{ color: '#6E7F86' }}>No priorities surfaced — sources too thin.</p>
          : (
            <ul className="space-y-1">
              {brief.topPriorities.map((p, i) => (
                <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>• {p}</li>
              ))}
            </ul>
          )}
      </Section>

      {/* Discovery questions */}
      <Section icon={<FileText size={13} color="#1E6F70" />} title={`Discovery questions (${brief.discoveryQuestions.length})`} color="#1E6F70">
        {brief.discoveryQuestions.length === 0
          ? <p className="text-xs" style={{ color: '#6E7F86' }}>No questions — try regenerating with sources.</p>
          : (
            <ol className="space-y-2 list-decimal list-inside">
              {brief.discoveryQuestions.map((q, i) => (
                <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q}</li>
              ))}
            </ol>
          )}
      </Section>

      {/* Likely objections */}
      <Section icon={<AlertCircle size={13} color="#D08A3E" />} title="Likely objections" color="#D08A3E">
        {brief.likelyObjections.length === 0
          ? <p className="text-xs" style={{ color: '#6E7F86' }}>—</p>
          : (
            <div className="space-y-3">
              {brief.likelyObjections.map((o, i) => (
                <div key={i} className="rounded-lg p-3" style={{
                  background: 'rgba(208,138,62,0.04)',
                  border: '1px solid rgba(208,138,62,0.15)',
                }}>
                  <p className="text-sm font-medium mb-1" style={{ color: '#D08A3E' }}>"{o.objection}"</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: '#6E7F86' }}>Handling: </span>
                    {o.handling}
                  </p>
                </div>
              ))}
            </div>
          )}
      </Section>

      {/* Mechanism connection */}
      <Section icon={<Sparkles size={13} color="#1E6F70" />} title="Mechanism → their pain" color="#1E6F70">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {brief.mechanismConnection || '—'}
        </p>
      </Section>

      {/* Call structure */}
      <Section icon={<Clock size={13} color="#CC6B4F" />} title={`Call structure (${totalMin} min)`} color="#CC6B4F">
        <div className="space-y-1.5">
          {brief.callStructure.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="font-mono" style={{ color: '#CC6B4F', minWidth: '40px' }}>{p.minutes}m</span>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.phase}</p>
                <p style={{ color: '#6E7F86' }}>{p.goal}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Regenerate */}
      <button onClick={onRegenerate} disabled={loading} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
        <Wand2 size={11} /> Regenerate brief
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Debrief section — BANT capture form
// -----------------------------------------------------------------------------

function DebriefSection({ lead, onSave }: { lead: PipelineLead; onSave: (d: CallDebrief) => void }) {
  const existing = lead.callDebrief;
  const [form, setForm] = useState<CallDebrief>(existing || {
    completedAt: new Date().toISOString(),
    painConfirmed: false,
    budgetConfirmed: false,
    decisionMakerConfirmed: false,
    timelineConfirmed: false,
    nextStep: '',
  });

  const score = bantScore(form);
  const verdict = bantVerdict(score);
  const ready = isDebriefReady(form);

  const verdictColor = { good: '#1E6F70', warn: '#D08A3E', bad: '#B0432A' }[verdict.tone];

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: '#6E7F86' }}>
        Capture the truth, not the wish. Tick what was actually confirmed; write notes for what was hinted.
      </p>

      {/* BANT pillars */}
      {(['pain', 'budget', 'decisionMaker', 'timeline'] as BantPillar[]).map((pillar) => {
        const status = pillarStatus(form, pillar);
        const confirmedKey = `${pillar}Confirmed` as const;
        const notesKey = `${pillar}Notes` as const;
        return (
          <div key={pillar} className="rounded-lg p-3" style={{
            background: status === 'confirmed' ? 'rgba(30,111,112,0.05)'
              : status === 'noted' ? 'rgba(208,138,62,0.04)'
              : 'rgba(255,255,255,0.02)',
            border: `1px solid ${
              status === 'confirmed' ? 'rgba(30,111,112,0.2)'
              : status === 'noted' ? 'rgba(208,138,62,0.2)'
              : 'rgba(255,255,255,0.05)'
            }`,
          }}>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={form[confirmedKey] as boolean}
                onChange={(e) => setForm({ ...form, [confirmedKey]: e.target.checked } as CallDebrief)}
              />
              <span className="text-sm font-medium" style={{ color: '#E6DCC8' }}>
                {BANT_LABELS[pillar]} confirmed
              </span>
              {status === 'noted' && (
                <span className="text-xs ml-auto" style={{ color: '#D08A3E' }}>noted but not confirmed</span>
              )}
            </label>
            <textarea
              rows={2}
              className="input-field text-sm w-full resize-none"
              placeholder={`What did they say about ${BANT_LABELS[pillar].toLowerCase()}?`}
              value={(form[notesKey] as string) || ''}
              onChange={(e) => setForm({ ...form, [notesKey]: e.target.value } as CallDebrief)}
            />
          </div>
        );
      })}

      {/* Objection */}
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
          Objection raised (optional)
        </label>
        <input
          className="input-field text-sm w-full"
          placeholder={`e.g. "We've been burned before — can you start with a small pilot?"`}
          value={form.objectionRaised || ''}
          onChange={(e) => setForm({ ...form, objectionRaised: e.target.value })}
        />
      </div>

      {/* Next step — required */}
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
          Next step agreed *
        </label>
        <input
          className="input-field text-sm w-full"
          placeholder={`e.g. "I send proposal Tuesday; they confirm by Friday"`}
          value={form.nextStep}
          onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
        />
      </div>

      {/* BANT verdict */}
      <div className="rounded-lg p-3" style={{
        background: `${verdictColor}10`,
        border: `1px solid ${verdictColor}40`,
      }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: verdictColor, fontFamily: 'Syne' }}>
            BANT · {score}/4 · {verdict.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{verdict.advice}</p>
      </div>

      <button
        onClick={() => onSave({ ...form, completedAt: new Date().toISOString() })}
        disabled={!form.nextStep.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Check size={13} />
        {existing ? 'Update debrief' : 'Save debrief'}
        {ready && <ArrowRight size={11} />}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Proposal section — generate + preview Markdown
// -----------------------------------------------------------------------------

function ProposalSection({ lead, loading, onGenerate }: {
  lead: PipelineLead; loading: boolean; onGenerate: () => void;
}) {
  const debrief = lead.callDebrief;
  const proposal = lead.proposal;
  const ready = isDebriefReady(debrief);

  if (!debrief) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-3" style={{ color: '#6E7F86' }}>
          Complete the debrief first — proposals depend on what got confirmed.
        </p>
      </div>
    );
  }

  if (!ready) {
    const score = bantScore(debrief);
    const verdict = bantVerdict(score);
    return (
      <div className="rounded-lg p-4" style={{
        background: 'rgba(208,138,62,0.06)',
        border: '1px solid rgba(208,138,62,0.22)',
      }}>
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle size={14} color="#D08A3E" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#D08A3E', fontFamily: 'Syne' }}>
              BANT verdict: {verdict.label} ({score}/4)
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>{verdict.advice}</p>
          </div>
        </div>
        <p className="text-xs italic" style={{ color: '#6E7F86' }}>
          Proposal is gated until pain is confirmed AND a next step is set. Edit the debrief above.
        </p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg p-3" style={{
          background: 'rgba(30,111,112,0.06)',
          border: '1px solid rgba(30,111,112,0.2)',
        }}>
          <p className="text-xs" style={{ color: '#1E6F70' }}>
            Debrief is solid. Generating the proposal will use ONLY what's in the debrief — no invented capabilities.
          </p>
        </div>
        <button onClick={onGenerate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Wand2 size={14} />}
          {loading ? 'Composing proposal…' : 'Generate proposal'}
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.markdown);
    toast.success('Markdown copied — paste into Notion / Google Docs');
  };

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Price"     value={`$${proposal.price.toLocaleString()}`} color="#1E6F70" />
        <Stat label="Milestones" value={proposal.milestones.length.toString()}  color="#1E6F70" />
        <Stat label="Timeline"  value={proposal.timeline || '—'}                color="#CC6B4F" />
      </div>

      {/* Risk reversal */}
      {proposal.riskReversal && (
        <div className="rounded-lg p-3" style={{
          background: 'rgba(58,143,163,0.06)',
          border: '1px solid rgba(58,143,163,0.18)',
        }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#1E6F70' }}>Risk reversal</p>
          <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{proposal.riskReversal}</p>
        </div>
      )}

      {/* Markdown preview */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#6E7F86' }}>Markdown preview</p>
        <pre className="text-xs p-4 rounded-lg whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto" style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
          color: 'var(--text-primary)',
          maxHeight: '400px',
        }}>
          {proposal.markdown}
        </pre>
      </div>

      <div className="flex gap-2">
        <button onClick={handleCopy} className="btn-primary flex items-center gap-2 text-sm flex-1">
          <Copy size={13} /> Copy Markdown
        </button>
        <button onClick={onGenerate} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <Wand2 size={13} /> Regenerate
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: '#6E7F86' }}>
        Paste into Notion, Google Docs, or your proposal tool of choice
        <ExternalLink size={9} className="inline ml-1" />
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reusable bits
// -----------------------------------------------------------------------------

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-semibold" style={{ color, fontFamily: 'Syne' }}>{title}</span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <p className="text-xs" style={{ color: '#6E7F86' }}>{label}</p>
      <p className="text-base font-bold" style={{ color, fontFamily: 'Syne' }}>{value}</p>
    </div>
  );
}
