// This page exists because: the previous /analytics dashboard was reading
// from a permanently-empty array, every metric was always 0, and the KPIs
// were vanity ("messages sent", "posts generated"). Phase 5 rebuilds it
// around the brief's 7 honest KPIs (Calls Booked, Proposals Sent, Deals
// Closed, Revenue, plus 3 conversion rates) — every number derived from
// PipelineLead.stageHistory, which we now stamp on every transition.

import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronUp, MessageCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  computeMetrics, compareMetrics,
  thisMonth, lastMonth, thisWeek, lastWeek,
  formatRate, formatRevenue, formatDelta,
  type TimeRange,
} from '@/lib/analytics';
import WhatsStuckPanel from '@/components/analytics/WhatsStuckPanel';
import WeeklyReviewModal from '@/components/analytics/WeeklyReviewModal';
import AuthorityGapBanner from '@/components/icp/AuthorityGapBanner';
import ChannelMixCoach from '@/components/channels/ChannelMixCoach';
import SyncPanel from '@/components/sync/SyncPanel';

type RangeChoice = 'this-month' | 'last-month' | 'this-week' | 'last-week';

export default function AnalyticsPage() {
  const { pipelineLeads, posts, twitterThreads, sequences, outcomes, tweets } = useStore();
  const [rangeChoice, setRangeChoice] = useState<RangeChoice>('this-month');
  const [activitySectionOpen, setActivitySectionOpen] = useState(false);

  const range = pickRange(rangeChoice);
  const previousRange = pickPreviousRange(rangeChoice);
  const current = computeMetrics(pipelineLeads, range);
  const previous = computeMetrics(pipelineLeads, previousRange);
  const comparison = compareMetrics(current, previous);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 md:px-8 py-5 border-b" style={{ borderColor: 'rgba(58,143,163,0.1)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={18} color="#3A8FA3" />
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                Honest Dashboard
              </h2>
            </div>
            <p className="text-sm" style={{ color: '#6E7F86' }}>
              Calls booked, proposals sent, deals closed, revenue closed. Every number is real.
            </p>
          </div>

          {/* Range selector + weekly review */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRangeChoice(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: rangeChoice === opt.value ? 'rgba(58,143,163,0.2)' : 'transparent',
                    color: rangeChoice === opt.value ? '#1E6F70' : '#6E7F86',
                    border: rangeChoice === opt.value ? '1px solid rgba(58,143,163,0.3)' : '1px solid transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <WeeklyReviewModal />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* Authority Gap — Phase 4 — surfaces here too because this is the dashboard */}
        <AuthorityGapBanner />

        {/* KPI grid — the only metrics that exist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI
            label="Calls Booked"
            value={current.callsBooked.toString()}
            delta={comparison.deltas.callsBooked}
            color="#3A8FA3"
            tooltip={`vs ${previousRange.label.toLowerCase()}: ${previous.callsBooked}`}
          />
          <KPI
            label="Proposals Sent"
            value={current.proposalsSent.toString()}
            delta={comparison.deltas.proposalsSent}
            color="#1E6F70"
            tooltip={`vs ${previousRange.label.toLowerCase()}: ${previous.proposalsSent}`}
          />
          <KPI
            label="Deals Closed"
            value={current.dealsClosed.toString()}
            delta={comparison.deltas.dealsClosed}
            color="#1E6F70"
            tooltip={`vs ${previousRange.label.toLowerCase()}: ${previous.dealsClosed}`}
          />
          <KPI
            label="Revenue Closed"
            value={formatRevenue(current.revenueClosed)}
            delta={comparison.deltas.revenueClosed}
            color="#D08A3E"
            tooltip={`vs ${previousRange.label.toLowerCase()}: ${formatRevenue(previous.revenueClosed)}`}
          />

          <KPI
            label="Replies → Calls"
            value={formatRate(current.replyToCallRate)}
            delta={comparison.deltas.replyToCallRate}
            color="#CC6B4F"
            tooltip={`${current.callsBooked} calls / ${current.repliesInRange} replies`}
            diagnostic
          />
          <KPI
            label="Calls → Proposals"
            value={formatRate(current.callToProposalRate)}
            delta={comparison.deltas.callToProposalRate}
            color="#CC6B4F"
            tooltip={`${current.proposalsSent} proposals / ${current.callsBooked} calls`}
            diagnostic
          />
          <KPI
            label="Proposals → Closed"
            value={formatRate(current.proposalToCloseRate)}
            delta={comparison.deltas.proposalToCloseRate}
            color="#CC6B4F"
            tooltip={`${current.dealsClosed} won / ${current.proposalsSent} proposals`}
            diagnostic
          />
          {/* Empty cell for visual balance on the diagnostic row */}
          <div className="hidden md:block" />
        </div>

        {/* Channel Mix — Phase 6 */}
        <ChannelMixCoach />

        {/* Sync Panel — Phase 8 */}
        <SyncPanel />

        {/* What's Stuck */}
        <WhatsStuckPanel />

        {/* Detailed Activity — collapsed by default. The brief: "If the user
            wants them, they can dig into a Detailed Activity page." Same idea,
            same page, but visually demoted. */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setActivitySectionOpen(!activitySectionOpen)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={13} color="#6E7F86" />
              <span className="text-xs font-medium" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
                Detailed Activity (vanity metrics)
              </span>
              <span className="text-xs" style={{ color: '#6E7F86' }}>
                — these don't predict revenue but the data's here if you want it
              </span>
            </div>
            {activitySectionOpen
              ? <ChevronUp size={13} color="#6E7F86" />
              : <ChevronDown size={13} color="#6E7F86" />}
          </button>

          {activitySectionOpen && (
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <ActivityStat label="LinkedIn posts" value={posts.length} />
              <ActivityStat label="Tweets" value={tweets.length} />
              <ActivityStat label="Threads" value={twitterThreads.length} />
              <ActivityStat label="Sequences" value={sequences.length} />
              <ActivityStat label="Pipeline leads" value={pipelineLeads.length} />
              <ActivityStat label="Active leads" value={pipelineLeads.filter((l) => l.stage !== 'closed-won' && l.stage !== 'closed-lost').length} />
              <ActivityStat label="Outcome events" value={outcomes.length} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const RANGE_OPTIONS: { value: RangeChoice; label: string }[] = [
  { value: 'this-week',  label: 'This week'  },
  { value: 'last-week',  label: 'Last week'  },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
];

function pickRange(choice: RangeChoice): TimeRange {
  switch (choice) {
    case 'this-week':  return thisWeek();
    case 'last-week':  return lastWeek();
    case 'last-month': return lastMonth();
    case 'this-month':
    default:           return thisMonth();
  }
}

function pickPreviousRange(choice: RangeChoice): TimeRange {
  switch (choice) {
    case 'this-week':  return lastWeek();
    case 'last-week':  return { ...lastWeek(new Date(Date.now() - 7 * 86_400_000)) };
    case 'this-month': return lastMonth();
    case 'last-month': return { ...lastMonth(new Date(Date.now() - 30 * 86_400_000)) };
    default:           return lastMonth();
  }
}

interface KPIProps {
  label: string;
  value: string;
  delta: number | null;
  color: string;
  tooltip?: string;
  diagnostic?: boolean;
}

function KPI({ label, value, delta, color, tooltip, diagnostic }: KPIProps) {
  const deltaPositive = delta !== null && delta >= 0;
  return (
    <div
      className="glass-card p-4"
      style={{
        borderColor: diagnostic ? 'rgba(204,107,79,0.18)' : 'rgba(58,143,163,0.1)',
        background: diagnostic ? 'rgba(204,107,79,0.04)' : undefined,
      }}
      title={tooltip}
    >
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs" style={{ color: '#6E7F86' }}>{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold" style={{ color, fontFamily: 'Syne' }}>{value}</p>
        {delta !== null && delta !== 0 && (
          <span
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: deltaPositive ? '#1E6F70' : '#B0432A' }}
          >
            {deltaPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatDelta(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <p className="text-xs" style={{ color: '#6E7F86' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>{value}</p>
    </div>
  );
}
