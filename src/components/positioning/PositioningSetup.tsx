// This component exists because: a vague offer guarantees vague replies, which
// guarantees zero clients. Forcing the user through a commit-or-block wizard
// before they can generate any outreach is the single highest-leverage thing
// the app can do for someone who hasn't landed a paying client yet.

import React, { useState } from 'react';
import {
  Crosshair, Target, Heart, Wrench, BarChart3, FileCheck,
  Ban, ChevronLeft, ChevronRight, Check, AlertCircle, Plus, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import {
  validateNiche, validatePainfulProblem, validateMechanism,
  validateOutcome, validateProofAsset, validateNotFor,
  emptyPositioning, type ValidationResult,
} from '@/lib/positioning';
import type { UserPositioning, ProofAsset, ProofAssetType } from '@/lib/types';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { num: 1, label: 'Niche', icon: Target },
  { num: 2, label: 'Problem', icon: Heart },
  { num: 3, label: 'Mechanism', icon: Wrench },
  { num: 4, label: 'Outcome', icon: BarChart3 },
  { num: 5, label: 'Proof', icon: FileCheck },
  { num: 6, label: 'Not For', icon: Ban },
];

const PROOF_TYPES: { value: ProofAssetType; label: string }[] = [
  { value: 'github', label: 'GitHub repo' },
  { value: 'case-study', label: 'Case study' },
  { value: 'demo', label: 'Demo / video' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'website', label: 'Website / portfolio' },
  { value: 'other', label: 'Other' },
];

export default function PositioningSetup({ onComplete }: Props) {
  const { userPositioning, setUserPositioning } = useStore();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<UserPositioning>(
    () => userPositioning?.targetRole ? userPositioning : emptyPositioning()
  );

  // Per-step validators — re-evaluated on every keystroke
  const stepValidation: ValidationResult = (() => {
    switch (step) {
      case 1: return validateNiche(draft.targetRole, draft.targetCompanyType);
      case 2: return validatePainfulProblem(draft.painfulProblem);
      case 3: return validateMechanism(draft.mechanism);
      case 4: return validateOutcome(draft.outcomeMetric, draft.outcomeTimeframe);
      case 5: {
        if (draft.proofAssets.length < 1) {
          return { ok: false, reason: 'You need at least one proof asset to land a paying client.' };
        }
        const bad = draft.proofAssets.find((a) => !validateProofAsset(a).ok);
        if (bad) return validateProofAsset(bad);
        return { ok: true };
      }
      case 6: return validateNotFor(draft.notFor);
      default: return { ok: true };
    }
  })();

  const handleNext = () => {
    if (!stepValidation.ok) {
      toast.error(stepValidation.reason || 'Fix the errors before continuing');
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Final commit
      setUserPositioning(draft);
      toast.success('Positioning locked in. Time to land a client.');
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(180deg, #F7F2E7 0%, #F2EBDD 100%)',
      border: '1px solid rgba(58,143,163,0.25)',
      boxShadow: '0 0 80px rgba(58,143,163,0.15)',
    }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(58,143,163,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #3A8FA3, #1E6F70)',
          }}>
            <Crosshair size={18} color="white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'Syne' }}>
              Positioning Setup
            </h2>
            <p className="text-xs" style={{ color: '#6E7F86' }}>
              Step {step} of 6 — every AI output gets sharper after this is locked in
            </p>
          </div>
        </div>

        {/* Progress strip */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                onClick={() => s.num < step && setStep(s.num)}
                disabled={s.num > step}
                className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all"
                style={{
                  background: isCurrent ? 'rgba(58,143,163,0.18)' : isDone ? 'rgba(30,111,112,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? 'rgba(58,143,163,0.4)' : isDone ? 'rgba(30,111,112,0.25)' : 'rgba(255,255,255,0.04)'}`,
                  cursor: s.num < step ? 'pointer' : 'default',
                }}
              >
                {isDone ? (
                  <Check size={11} color="#1E6F70" />
                ) : (
                  <Icon size={11} color={isCurrent ? '#1E6F70' : '#6E7F86'} />
                )}
                <span className="text-xs font-medium" style={{
                  color: isCurrent ? '#1E6F70' : isDone ? '#1E6F70' : '#6E7F86',
                }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 min-h-[380px]">
        {step === 1 && <Step1Niche draft={draft} setDraft={setDraft} />}
        {step === 2 && <Step2Problem draft={draft} setDraft={setDraft} />}
        {step === 3 && <Step3Mechanism draft={draft} setDraft={setDraft} />}
        {step === 4 && <Step4Outcome draft={draft} setDraft={setDraft} />}
        {step === 5 && <Step5Proof draft={draft} setDraft={setDraft} />}
        {step === 6 && <Step6NotFor draft={draft} setDraft={setDraft} />}

        {/* Inline validation feedback */}
        {!stepValidation.ok && stepValidation.reason && (
          <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
            background: 'rgba(208,138,62,0.08)',
            border: '1px solid rgba(208,138,62,0.25)',
          }}>
            <AlertCircle size={14} color="#D08A3E" className="flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: '#D08A3E' }}>{stepValidation.reason}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-between" style={{
        background: 'rgba(0,0,0,0.25)',
        borderTop: '1px solid rgba(58,143,163,0.12)',
      }}>
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-30"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: '#6E7F86',
          }}
        >
          <ChevronLeft size={12} />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!stepValidation.ok}
          className="text-xs px-4 py-2 rounded-lg flex items-center gap-1 transition-all font-medium"
          style={{
            background: stepValidation.ok
              ? 'linear-gradient(135deg, #3A8FA3, #1E6F70)'
              : 'rgba(255,255,255,0.05)',
            color: stepValidation.ok ? 'white' : '#6E7F86',
            cursor: stepValidation.ok ? 'pointer' : 'not-allowed',
          }}
        >
          {step === 6 ? 'Lock In Positioning' : 'Next'}
          {step < 6 && <ChevronRight size={12} />}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step components — each is dumb, takes draft + setDraft, renders form fields
// and good/bad examples. Validators live in one place (positioning.ts) so the
// rules can't drift between UI and server.
// -----------------------------------------------------------------------------

interface StepProps {
  draft: UserPositioning;
  setDraft: (d: UserPositioning) => void;
}

function Step1Niche({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          Who do you serve?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          Pick one role at one company type. "Anyone with a problem" is the fastest way to land zero clients.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
            Role *
          </label>
          <input
            className="input-field text-sm w-full"
            placeholder="e.g. VP of Engineering, Head of Growth"
            value={draft.targetRole}
            onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
            Company type *
          </label>
          <input
            className="input-field text-sm w-full"
            placeholder="e.g. Series A B2B SaaS, 20-80 engineers"
            value={draft.targetCompanyType}
            onChange={(e) => setDraft({ ...draft, targetCompanyType: e.target.value })}
          />
        </div>
      </div>

      <ExamplesBox good="VP of Engineering at Series A B2B SaaS, 20-80 engineers" bad="Founders / CEOs / VPs at companies of all sizes in various industries" />
    </div>
  );
}

function Step2Problem({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          What painful problem do they hire you for?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          How would the prospect describe this to a friend at 11pm on a Tuesday? That's the language to use.
        </p>
      </div>

      <textarea
        rows={4}
        className="input-field text-sm w-full resize-none"
        placeholder="e.g. Our deploy pipeline takes 40 minutes; engineers context-switch 4 times waiting for it; we've delayed two releases this quarter because of flaky tests."
        value={draft.painfulProblem}
        onChange={(e) => setDraft({ ...draft, painfulProblem: e.target.value })}
      />

      <ExamplesBox
        good="Their CEO yells at them every Monday because the analytics dashboard hasn't shipped in 5 weeks and engineering can't say why."
        bad="They struggle with productivity and growth."
      />
    </div>
  );
}

function Step3Mechanism({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          How do you solve it — specifically?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          "I code well" is not a mechanism. Name the actual approach, framework, or sequence you use.
        </p>
      </div>

      <textarea
        rows={4}
        className="input-field text-sm w-full resize-none"
        placeholder="e.g. I instrument the test suite to find the slowest 5% of tests, parallelize them with Turborepo cache layers, and rewrite the 3 most-flaky tests per sprint until P95 wait time drops below 8 minutes."
        value={draft.mechanism}
        onChange={(e) => setDraft({ ...draft, mechanism: e.target.value })}
      />

      <ExamplesBox
        good="A 2-week diagnostic where I trace every customer signup through the funnel and flag the 3 highest-drop-off events with code-level fixes."
        bad="I bring deep expertise and best practices to deliver world-class results."
      />
    </div>
  );
}

function Step4Outcome({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          What measurable outcome do you produce?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          Numbers force specificity. If you have no past results, write a plausible projection — we'll label it as such.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
            Metric *
          </label>
          <input
            className="input-field text-sm w-full"
            placeholder="e.g. 30% reduction in CI/CD wait time"
            value={draft.outcomeMetric}
            onChange={(e) => setDraft({ ...draft, outcomeMetric: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
            Timeframe *
          </label>
          <input
            className="input-field text-sm w-full"
            placeholder="e.g. within 6 weeks"
            value={draft.outcomeTimeframe}
            onChange={(e) => setDraft({ ...draft, outcomeTimeframe: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.outcomeIsProjected}
          onChange={(e) => setDraft({ ...draft, outcomeIsProjected: e.target.checked })}
          className="mt-0.5"
        />
        <div>
          <p className="text-xs" style={{ color: '#D6CCB6' }}>
            This outcome is projected — I haven't measured it on a real client yet.
          </p>
          <p className="text-xs" style={{ color: '#6E7F86' }}>
            (Honest. The AI will surface "(projected)" wherever this metric appears.)
          </p>
        </div>
      </label>

      <ExamplesBox
        good="40% drop in customer onboarding time, within the first 90 days"
        bad="Better customer experience over time"
      />
    </div>
  );
}

function Step5Proof({ draft, setDraft }: StepProps) {
  const [newAsset, setNewAsset] = useState<Partial<ProofAsset>>({ type: 'github' });

  const addAsset = () => {
    const v = validateProofAsset(newAsset);
    if (!v.ok) {
      toast.error(v.reason || 'Invalid asset');
      return;
    }
    setDraft({
      ...draft,
      proofAssets: [...draft.proofAssets, newAsset as ProofAsset],
    });
    setNewAsset({ type: 'github' });
  };

  const removeAsset = (idx: number) => {
    setDraft({
      ...draft,
      proofAssets: draft.proofAssets.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          What proof do you have?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          One real artifact you can link to. GitHub, case study, demo video, testimonial. Without proof, cold DMs don't convert.
        </p>
      </div>

      {/* Existing assets */}
      {draft.proofAssets.length > 0 && (
        <div className="space-y-2">
          {draft.proofAssets.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{
              background: 'rgba(30,111,112,0.06)', border: '1px solid rgba(30,111,112,0.18)',
            }}>
              <Check size={12} color="#1E6F70" />
              <span className="text-xs font-medium" style={{ color: '#1E6F70' }}>{a.label}</span>
              <span className="text-xs truncate flex-1" style={{ color: '#6E7F86' }}>{a.url}</span>
              <button onClick={() => removeAsset(i)} className="p-1">
                <Trash2 size={11} color="#CC6B4F" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="p-3 rounded-lg space-y-2" style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            className="input-field text-sm"
            value={newAsset.type}
            onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as ProofAssetType })}
          >
            {PROOF_TYPES.map((t) => (
              <option key={t.value} value={t.value} style={{ background: '#F7F2E7' }}>{t.label}</option>
            ))}
          </select>
          <input
            className="input-field text-sm"
            placeholder="Short label"
            value={newAsset.label || ''}
            onChange={(e) => setNewAsset({ ...newAsset, label: e.target.value })}
          />
          <input
            className="input-field text-sm"
            placeholder="https://..."
            value={newAsset.url || ''}
            onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
          />
        </div>
        <button
          onClick={addAsset}
          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{ background: 'rgba(58,143,163,0.18)', color: '#1E6F70' }}
        >
          <Plus size={11} />
          Add proof asset
        </button>
      </div>

      {draft.proofAssets.length === 0 && (
        <div className="p-3 rounded-lg" style={{
          background: 'rgba(208,138,62,0.06)', border: '1px solid rgba(208,138,62,0.2)',
        }}>
          <p className="text-xs" style={{ color: '#D08A3E' }}>
            No proof yet? Build one this week. A 5-minute Loom walkthrough of a side-project counts.
          </p>
        </div>
      )}
    </div>
  );
}

function Step6NotFor({ draft, setDraft }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Syne' }}>
          Who are you NOT for?
        </h3>
        <p className="text-xs" style={{ color: '#6E7F86' }}>
          Almost no beginner writes this. Naming who you turn away makes everything else credible.
        </p>
      </div>

      <textarea
        rows={4}
        className="input-field text-sm w-full resize-none"
        placeholder="e.g. Pre-product startups with no engineering team, agencies looking for white-label labour, anyone whose first question is 'what's your hourly rate'."
        value={draft.notFor}
        onChange={(e) => setDraft({ ...draft, notFor: e.target.value })}
      />

      <ExamplesBox
        good="Companies under 5 engineers, anyone shopping for the cheapest bid, projects without a clear business owner."
        bad="I'm flexible and happy to work with anyone."
      />

      {draft.targetRole && draft.targetCompanyType && (
        <div className="p-3 rounded-lg space-y-1" style={{
          background: 'rgba(58,143,163,0.08)', border: '1px solid rgba(58,143,163,0.2)',
        }}>
          <p className="text-xs font-semibold" style={{ color: '#1E6F70' }}>Your positioning preview</p>
          <p className="text-xs" style={{ color: '#D6CCB6' }}>
            <strong>I help</strong> {draft.targetRole} at {draft.targetCompanyType} <strong>solve</strong> {truncate(draft.painfulProblem, 80)} <strong>by</strong> {truncate(draft.mechanism, 80)} <strong>achieving</strong> {draft.outcomeMetric}{draft.outcomeIsProjected ? ' (projected)' : ''} {draft.outcomeTimeframe}.
          </p>
        </div>
      )}
    </div>
  );
}

// Reusable inline good/bad examples
function ExamplesBox({ good, bad }: { good: string; bad: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="p-3 rounded-lg" style={{
        background: 'rgba(30,111,112,0.06)', border: '1px solid rgba(30,111,112,0.18)',
      }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#1E6F70' }}>✓ Good</p>
        <p className="text-xs" style={{ color: '#D6CCB6' }}>{good}</p>
      </div>
      <div className="p-3 rounded-lg" style={{
        background: 'rgba(176,67,42,0.06)', border: '1px solid rgba(176,67,42,0.18)',
      }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#B0432A' }}>✗ Bad</p>
        <p className="text-xs" style={{ color: '#D6CCB6' }}>{bad}</p>
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}
