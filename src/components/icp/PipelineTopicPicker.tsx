// This component exists because: the brief killed the "trending topics" engine
// in Phase 0 (it was generic-content fabrication). Replacement is "what did
// your last 5 prospects struggle with this week?" — pulling topic ideas from
// the actual pipeline (notes + intent signals + research summaries). Posts
// generated from real prospect pain are the only ones that drive inbound DMs
// from the same kind of person.

import React, { useMemo } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { signalsForLead, freshestSignal, freshnessHours, formatFreshness } from '@/lib/intent';

interface PipelineTopic {
  leadName: string;
  leadId: string;
  source: 'signal' | 'note' | 'research';
  text: string;
  daysOld: number;
}

interface Props {
  onPick: (topic: PipelineTopic) => void;
}

const MAX_TOPICS = 5;

export default function PipelineTopicPicker({ onPick }: Props) {
  const { pipelineLeads, intentSignals, leadResearch } = useStore();

  const topics = useMemo<PipelineTopic[]>(() => {
    const out: PipelineTopic[] = [];
    const now = Date.now();
    const seenLeads = new Set<string>();

    // Sort leads by recent activity (updatedAt desc), filter active
    const activeLeads = pipelineLeads
      .filter((l) => l.stage !== 'closed-won' && l.stage !== 'closed-lost')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    for (const lead of activeLeads) {
      if (seenLeads.has(lead.id)) continue;
      const fullName = `${lead.firstName} ${lead.lastName}`.trim() || lead.company || 'Unknown lead';

      // Priority 1: freshest intent signal
      const sigs = signalsForLead(intentSignals, lead.id);
      const top = freshestSignal(sigs);
      if (top) {
        const hours = freshnessHours(top);
        out.push({
          leadName: fullName,
          leadId: lead.id,
          source: 'signal',
          text: top.title || top.content,
          daysOld: hours / 24,
        });
        seenLeads.add(lead.id);
        if (out.length >= MAX_TOPICS) break;
        continue;
      }

      // Priority 2: research summary (mentions a real pain)
      const research = leadResearch.find((r) => r.leadName === fullName);
      if (research && research.summary) {
        out.push({
          leadName: fullName,
          leadId: lead.id,
          source: 'research',
          text: research.summary,
          daysOld: (now - new Date(research.updatedAt).getTime()) / 86_400_000,
        });
        seenLeads.add(lead.id);
        if (out.length >= MAX_TOPICS) break;
        continue;
      }

      // Priority 3: lead notes (the user's own observations)
      if (lead.notes && lead.notes.trim().length > 10) {
        out.push({
          leadName: fullName,
          leadId: lead.id,
          source: 'note',
          text: lead.notes,
          daysOld: (now - new Date(lead.updatedAt).getTime()) / 86_400_000,
        });
        seenLeads.add(lead.id);
        if (out.length >= MAX_TOPICS) break;
      }
    }

    return out;
  }, [pipelineLeads, intentSignals, leadResearch]);

  return (
    <div className="rounded-xl p-4" style={{
      background: 'rgba(16,185,129,0.05)',
      border: '1px solid rgba(16,185,129,0.18)',
    }}>
      <div className="flex items-center gap-2 mb-1">
        <Users size={13} color="#10b981" />
        <span className="text-xs font-semibold" style={{ color: '#10b981', fontFamily: 'Syne' }}>
          What did your last {MAX_TOPICS} prospects struggle with?
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: '#64748b' }}>
        Pick one. Write about that pain. Real prospect → real post → more prospects who feel the same way.
      </p>

      {topics.length === 0 ? (
        <p className="text-xs italic px-3 py-2" style={{ color: '#475569' }}>
          No active prospects with signals or notes yet. Add intent signals on pipeline cards or paste research to populate this list.
        </p>
      ) : (
        <div className="space-y-1.5">
          {topics.map((topic) => (
            <button
              key={`${topic.leadId}-${topic.source}`}
              onClick={() => onPick(topic)}
              className="w-full text-left p-3 rounded-lg flex items-start gap-2 transition-all hover:bg-white/5 group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>
                    {topic.leadName}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: 'rgba(99,102,241,0.12)',
                    color: '#a5b4fc',
                    fontSize: '9px',
                  }}>
                    {topic.source}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: '#64748b' }}>
                    {formatFreshness(topic.daysOld * 24)} ago
                  </span>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#94a3b8' }}>
                  {topic.text}
                </p>
              </div>
              <ArrowRight
                size={12}
                color="#64748b"
                className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
