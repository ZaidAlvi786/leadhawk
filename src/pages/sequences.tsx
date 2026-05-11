import React, { useState } from 'react';
import { Wand2, Copy, Save, Trash2, Mail, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateEmailSequence } from '@/lib/ai';
import type { EmailSequence, SequenceStep, SequenceStepType } from '@/lib/types';
import PositioningGate from '@/components/positioning/PositioningGate';
import PositioningBanner from '@/components/positioning/PositioningBanner';
import toast from 'react-hot-toast';

const STEP_LABELS: Record<SequenceStepType, { label: string; color: string; bgColor: string }> = {
  'intro': { label: 'Intro', color: '#3A8FA3', bgColor: 'rgba(58,143,163,0.15)' },
  'value-add': { label: 'Value Add', color: '#1E6F70', bgColor: 'rgba(30,111,112,0.15)' },
  'follow-up': { label: 'Follow-up', color: '#D08A3E', bgColor: 'rgba(208,138,62,0.15)' },
  'breakup': { label: 'Breakup', color: '#B0432A', bgColor: 'rgba(176,67,42,0.15)' },
};

const DEFAULT_STEPS: { type: SequenceStepType; delay: number }[] = [
  { type: 'intro', delay: 0 },
  { type: 'value-add', delay: 3 },
  { type: 'breakup', delay: 5 },
];

export default function SequencesPage() {
  const { sequences, addSequence, deleteSequence, userProfile, userPositioning } = useStore();
  const [form, setForm] = useState({
    name: '',
    targetRole: '',
    industry: '',
    tone: 'professional' as EmailSequence['tone'],
    stepCount: 3,
  });
  const [generatedSteps, setGeneratedSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSeq, setExpandedSeq] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!form.targetRole || !form.industry) {
      toast.error('Enter target role and industry');
      return;
    }
    setLoading(true);
    try {
      const result = await generateEmailSequence({
        targetRole: form.targetRole,
        industry: form.industry,
        tone: form.tone,
        yourService: userProfile.service,
        yourName: userProfile.name || 'your name',
        sequenceLength: form.stepCount,
        positioning: userPositioning,
      });
      if (!result.steps?.length) {
        toast.error('AI returned empty sequence — try again');
        setLoading(false);
        return;
      }
      const steps: SequenceStep[] = result.steps.map((s, i) => ({
        id: `step-${Date.now()}-${i}`,
        stepNumber: i + 1,
        type: (s.type || DEFAULT_STEPS[i]?.type || 'follow-up') as SequenceStepType,
        subject: s.subject || '',
        body: s.body || '',
        delayDays: s.delayDays ?? DEFAULT_STEPS[i]?.delay ?? (i * 3),
      }));
      setGeneratedSteps(steps);
      toast.success(`${steps.length}-step sequence generated!`);
    } catch {
      toast.error('Generation failed');
    }
    setLoading(false);
  };

  const updateStep = (stepId: string, update: Partial<SequenceStep>) => {
    setGeneratedSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...update } : s))
    );
  };

  const handleSave = () => {
    if (!generatedSteps.length) {
      toast.error('Generate a sequence first');
      return;
    }
    const seq: EmailSequence = {
      id: Date.now().toString(),
      name: form.name || `${form.tone} → ${form.targetRole}`,
      targetRole: form.targetRole,
      industry: form.industry,
      tone: form.tone,
      steps: generatedSteps,
      createdAt: new Date().toISOString(),
    };
    addSequence(seq);
    toast.success('Sequence saved!');
    setGeneratedSteps([]);
    setForm({ name: '', targetRole: '', industry: '', tone: 'professional', stepCount: 3 });
  };

  const copySequence = (seq: EmailSequence) => {
    const text = seq.steps
      .map((s, i) => `--- Email ${i + 1} (${s.type}, Day ${s.delayDays}) ---\nSubject: ${s.subject}\n\n${s.body}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Full sequence copied!');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3A8FA3, #B0432A)' }}>
                <Mail size={13} color="white" />
              </div>
              <span className="text-xs font-medium tag tag-indigo">AI-Powered</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
              Email Sequence Builder
            </h2>
            <p className="text-sm" style={{ color: '#6E7F86' }}>
              Generate multi-step cold email sequences — intro, value-add, and breakup emails that actually get replies
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-lg font-bold" style={{ color: '#B0432A', fontFamily: 'Syne' }}>{sequences.length}</div>
              <div className="text-xs" style={{ color: '#6E7F86' }}>Sequences</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy bar */}
      <div className="px-4 md:px-8 py-4 border-b" style={{ borderColor: 'rgba(58,143,163,0.08)' }}>
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {DEFAULT_STEPS.map((s, i) => {
            const meta = STEP_LABELS[s.type];
            return (
              <React.Fragment key={s.type}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: meta.bgColor, color: meta.color, fontFamily: 'Syne' }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="text-xs" style={{ color: '#6E7F86' }}>Day {s.delay}</div>
                  </div>
                </div>
                {i < DEFAULT_STEPS.length - 1 && (
                  <div className="hidden sm:block flex-1 h-px max-w-16" style={{ background: 'rgba(58,143,163,0.2)' }} />
                )}
              </React.Fragment>
            );
          })}
          <div className="w-full md:w-auto md:ml-auto text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(30,111,112,0.1)', color: '#1E6F70', border: '1px solid rgba(30,111,112,0.2)' }}>
            80% of replies come from follow-ups
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        <PositioningBanner />
        <PositioningGate reason="Sequences need a sharp ICP to write coherent intro/value-add/breakup emails. Set positioning first.">
        {/* Generator Form */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} color="#B0432A" />
            <h3 className="font-semibold text-sm" style={{ color: '#CC6B4F', fontFamily: 'Syne' }}>
              Generate Sequence
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
                Target Role *
              </label>
              <input
                className="input-field text-sm"
                placeholder="CTO, VP Engineering, Founder..."
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
                Industry *
              </label>
              <input
                className="input-field text-sm"
                placeholder="SaaS, FinTech, E-Commerce..."
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
                Sequence Name (optional)
              </label>
              <input
                className="input-field text-sm"
                placeholder="Auto-generated if blank"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
                Tone
              </label>
              <select
                className="input-field text-sm"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value as EmailSequence['tone'] })}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="value-driven">Value-Driven</option>
                <option value="problem-solving">Problem-Solving</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <label className="text-xs font-medium" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>Steps:</label>
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setForm({ ...form, stepCount: n })}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: form.stepCount === n ? 'rgba(176,67,42,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${form.stepCount === n ? 'rgba(176,67,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: form.stepCount === n ? '#CC6B4F' : '#6E7F86',
                }}
              >
                {n} emails
              </button>
            ))}
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
            {loading ? 'Building Sequence...' : 'Generate Email Sequence'}
          </button>
        </div>

        {/* Generated Sequence Preview */}
        {generatedSteps.length > 0 && (
          <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(176,67,42,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail size={15} color="#B0432A" />
                <span className="text-sm font-medium" style={{ color: '#CC6B4F', fontFamily: 'Syne' }}>
                  Generated Sequence — {generatedSteps.length} Steps
                </span>
              </div>
              <button className="btn-primary flex items-center gap-2 text-sm" onClick={handleSave}>
                <Save size={13} /> Save Sequence
              </button>
            </div>

            <div className="space-y-3">
              {generatedSteps.map((step) => {
                const meta = STEP_LABELS[step.type] || STEP_LABELS['follow-up'];
                const isEditing = editingStep === step.id;
                return (
                  <div key={step.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: meta.bgColor, color: meta.color }}>
                        {meta.label}
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#6E7F86' }}>
                        <Clock size={10} />
                        Day {step.delayDays}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)', color: '#6E7F86' }}
                          onClick={() => setEditingStep(isEditing ? null : step.id)}
                        >
                          {isEditing ? 'Preview' : 'Edit'}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`); toast.success('Copied!'); }}>
                          <Copy size={12} color="#6E7F86" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          className="input-field text-sm w-full"
                          value={step.subject}
                          onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                          placeholder="Subject line"
                        />
                        <textarea
                          className="input-field text-sm w-full resize-none"
                          rows={4}
                          value={step.body}
                          onChange={(e) => updateStep(step.id, { body: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: '#6E7F86' }}>Delay (days):</label>
                          <input
                            type="number"
                            className="input-field text-sm w-20"
                            value={step.delayDays}
                            min={0}
                            onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-medium mb-1" style={{ color: '#6E7F86' }}>
                          Subject: {step.subject}
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#D6CCB6' }}>
                          {step.body}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Saved Sequences */}
        {sequences.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              Saved Sequences ({sequences.length})
            </h3>
            <div className="space-y-2">
              {sequences.map((seq) => {
                const isExpanded = expandedSeq === seq.id;
                return (
                  <div key={seq.id} className="glass-card overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{seq.name}</span>
                          <span className="tag tag-indigo text-xs">{seq.tone}</span>
                          <span className="tag tag-cyan text-xs">{seq.steps.length} steps</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#6E7F86' }}>
                          {seq.targetRole} in {seq.industry}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copySequence(seq)}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                          <Copy size={12} /> Copy All
                        </button>
                        <button onClick={() => setExpandedSeq(isExpanded ? null : seq.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(58,143,163,0.1)', border: '1px solid rgba(58,143,163,0.2)' }}>
                          {isExpanded ? <ChevronUp size={12} color="#1E6F70" /> : <ChevronDown size={12} color="#1E6F70" />}
                        </button>
                        <button onClick={() => { deleteSequence(seq.id); toast.success('Deleted'); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(176,67,42,0.1)', border: '1px solid rgba(176,67,42,0.2)' }}>
                          <Trash2 size={12} color="#CC6B4F" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="pt-3" />
                        {seq.steps.map((step) => {
                          const meta = STEP_LABELS[step.type] || STEP_LABELS['follow-up'];
                          return (
                            <div key={step.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: meta.bgColor, color: meta.color }}>
                                  {meta.label}
                                </span>
                                <span className="text-xs flex items-center gap-1" style={{ color: '#6E7F86' }}>
                                  <Clock size={9} /> Day {step.delayDays}
                                </span>
                                <button className="ml-auto" onClick={() => { navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`); toast.success('Copied!'); }}>
                                  <Copy size={11} color="#6E7F86" />
                                </button>
                              </div>
                              <div className="text-xs font-medium mb-1" style={{ color: '#6E7F86' }}>Subject: {step.subject}</div>
                              <div className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: '#6E7F86' }}>{step.body}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </PositioningGate>
      </div>
    </div>
  );
}
