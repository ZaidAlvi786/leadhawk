// This component exists because: the brief calls for a weekly Monday review
// that compares last week's numbers to the week before, surfaces an AI
// diagnosis, and gives the user ONE concrete action. Without this, weeks
// blur together — with it, the user gets one moment per week to see whether
// they're moving forward.

import React, { useEffect, useState } from 'react';
import { X, Wand2, ArrowRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { generateWeeklyDiagnosis, type WeeklyDiagnosis } from '@/lib/ai';
import {
  computeMetrics, lastWeek,
  formatRate, formatRevenue, formatDelta, compareMetrics,
} from '@/lib/analytics';

const REVIEW_SHOWN_KEY = 'leadhawk-weekly-review-shown-week';

/**
 * Returns "YYYY-Www" for the current ISO-ish week (Mon start).
 * Used to remember "we already showed the review this week, don't nag again."
 */
function currentWeekKey(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-W${String(Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604_800_000) + 1).padStart(2, '0')}`;
}

function isMonday(now: Date = new Date()): boolean {
  return now.getDay() === 1;
}

export default function WeeklyReviewModal() {
  const { pipelineLeads, userPositioning } = useStore();
  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState<WeeklyDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-open on Monday if not already shown this week.
  useEffect(() => {
    const seenKey = typeof window !== 'undefined' ? localStorage.getItem(REVIEW_SHOWN_KEY) : null;
    const thisKey = currentWeekKey();
    if (isMonday() && seenKey !== thisKey) {
      // Small delay so it doesn't pop instantly on first load
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(REVIEW_SHOWN_KEY, currentWeekKey());
    }
  };

  // Compute the comparison synchronously — no AI needed for this part.
  const lastW = lastWeek();
  const weekBefore = lastWeek(new Date(Date.now() - 7 * 86_400_000));
  const lastWeekMetrics = computeMetrics(pipelineLeads, lastW);
  const weekBeforeMetrics = computeMetrics(pipelineLeads, weekBefore);
  const comparison = compareMetrics(lastWeekMetrics, weekBeforeMetrics);

  const summarize = (m: typeof lastWeekMetrics): string =>
    `Calls booked: ${m.callsBooked} · Proposals: ${m.proposalsSent} · Deals closed: ${m.dealsClosed} · Revenue: ${formatRevenue(m.revenueClosed)} · Reply→Call ${formatRate(m.replyToCallRate)} · Call→Proposal ${formatRate(m.callToProposalRate)} · Proposal→Close ${formatRate(m.proposalToCloseRate)}`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateWeeklyDiagnosis({
        currentWeekSummary: summarize(lastWeekMetrics),
        previousWeekSummary: summarize(weekBeforeMetrics),
        positioning: userPositioning,
      });
      setDiagnosis(result);
    } catch {
      toast.error('Diagnosis failed — try again');
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger button when not auto-fired
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
        style={{
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#a5b4fc',
        }}
        title="Open weekly review"
      >
        <Calendar size={11} />
        Weekly review
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #050a14 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        boxShadow: '0 0 80px rgba(99,102,241,0.15)',
      }}>
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X size={14} color="#64748b" />
        </button>

        {/* Header */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            }}>
              <Calendar size={18} color="white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                The Truth · Weekly Review
              </h2>
              <p className="text-xs" style={{ color: '#64748b' }}>
                Last week's numbers vs the week before. The diagnosis is you.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Side-by-side weekly numbers */}
          <div className="grid grid-cols-2 gap-3">
            <WeekColumn title="Week before" m={weekBeforeMetrics} />
            <WeekColumn title="Last week" m={lastWeekMetrics} highlights={comparison.deltas} />
          </div>

          {/* AI diagnosis */}
          {!diagnosis ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <Wand2 size={14} />}
              {loading ? 'Diagnosing…' : 'Get the diagnosis'}
            </button>
          ) : (
            <div className="space-y-3">
              <DiagnosisField
                label="What happened"
                value={diagnosis.diagnosis}
                color="#cbd5e1"
              />
              <DiagnosisField
                label="Likely cause (your behavior)"
                value={diagnosis.likelyCause}
                color="#fcd34d"
              />
              <DiagnosisField
                label="One action this week"
                value={diagnosis.oneAction}
                color="#6ee7b7"
                accent
              />
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-1"
          >
            Got it
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface WeekColumnProps {
  title: string;
  m: ReturnType<typeof computeMetrics>;
  highlights?: ReturnType<typeof compareMetrics>['deltas'];
}

function WeekColumn({ title, m, highlights }: WeekColumnProps) {
  const Row = ({ label, value, delta }: { label: string; value: string; delta?: number | null }) => (
    <div className="flex items-baseline justify-between text-xs">
      <span style={{ color: '#64748b' }}>{label}</span>
      <span className="flex items-baseline gap-1">
        <span style={{ color: '#cbd5e1' }}>{value}</span>
        {delta !== undefined && delta !== null && delta !== 0 && (
          <span style={{ color: delta >= 0 ? '#10b981' : '#ef4444', fontSize: '10px' }}>
            {formatDelta(delta)}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <div className="rounded-lg p-3 space-y-1.5" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>{title}</p>
      <Row label="Calls booked"      value={m.callsBooked.toString()}     delta={highlights?.callsBooked} />
      <Row label="Proposals sent"    value={m.proposalsSent.toString()}   delta={highlights?.proposalsSent} />
      <Row label="Deals closed"      value={m.dealsClosed.toString()}     delta={highlights?.dealsClosed} />
      <Row label="Revenue"           value={formatRevenue(m.revenueClosed)} delta={highlights?.revenueClosed} />
      <Row label="Reply→Call"        value={formatRate(m.replyToCallRate)}    delta={highlights?.replyToCallRate} />
      <Row label="Call→Proposal"     value={formatRate(m.callToProposalRate)} delta={highlights?.callToProposalRate} />
      <Row label="Proposal→Close"    value={formatRate(m.proposalToCloseRate)} delta={highlights?.proposalToCloseRate} />
    </div>
  );
}

function DiagnosisField({ label, value, color, accent }: { label: string; value: string; color: string; accent?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{
      background: accent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      <p className="text-xs font-semibold mb-1" style={{ color, fontFamily: 'Syne' }}>{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{value || '—'}</p>
    </div>
  );
}
