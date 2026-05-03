import React from 'react';
import { CheckCircle2, Mail, MessageSquare, Calendar, ArrowRight, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Action {
  id: string;
  type: 'follow-up' | 'start-sequence' | 'send-message' | 'meeting-prep';
  title: string;
  description: string;
  leadName: string;
  leadId: string;
  icon: React.ReactNode;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

export default function DailyActionQueue() {
  const { pipelineLeads, sequences, updatePipelineLead } = useStore();
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());

  const actions: Action[] = React.useMemo(() => {
    const acts: Action[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    pipelineLeads.forEach((lead) => {
      // Follow-ups due
      if (
        lead.nextFollowUp &&
        new Date(lead.nextFollowUp) <= today &&
        lead.stage !== 'closed-won' &&
        lead.stage !== 'closed-lost'
      ) {
        acts.push({
          id: `followup_${lead.id}`,
          type: 'follow-up',
          title: `Follow up with ${lead.firstName}`,
          description: `Last contacted ${Math.floor((Date.now() - new Date(lead.lastContacted || Date.now()).getTime()) / 86400000)} days ago`,
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadId: lead.id,
          icon: <Calendar size={16} />,
          color: '#f59e0b',
          priority: 'high',
        });
      }

      // Suggest sequences for contacted leads without sequences
      if (
        lead.stage === 'contacted' &&
        !lead.sequenceId &&
        lead.email &&
        sequences.length > 0
      ) {
        acts.push({
          id: `sequence_${lead.id}`,
          type: 'start-sequence',
          title: `Start email sequence for ${lead.firstName}`,
          description: `${sequences.length} available sequences`,
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadId: lead.id,
          icon: <Mail size={16} />,
          color: '#6366f1',
          priority: 'high',
        });
      }

      // Meeting prep
      if (lead.stage === 'meeting') {
        acts.push({
          id: `meeting_${lead.id}`,
          type: 'meeting-prep',
          title: `Prepare for meeting with ${lead.firstName}`,
          description: `${lead.company} • ${lead.title}`,
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadId: lead.id,
          icon: <Zap size={16} />,
          color: '#10b981',
          priority: 'high',
        });
      }
    });

    return acts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [pipelineLeads, sequences]);

  const handleComplete = (actionId: string) => {
    setCompleted((prev) => new Set(prev).add(actionId));
    toast.success('Action marked complete!');
  };

  const activeActions = actions.filter((a) => !completed.has(a.id));

  if (activeActions.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
          <CheckCircle2 size={20} color="#10b981" />
        </div>
        <h3 className="text-sm font-medium text-white mb-1" style={{ fontFamily: 'Syne' }}>
          All set for today!
        </h3>
        <p className="text-xs" style={{ color: '#64748b' }}>
          No actions due today. Keep building your pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeActions.map((action) => (
        <div
          key={action.id}
          className="glass-card p-4 flex items-start gap-3 group hover:border-opacity-100 transition-all"
          style={{
            borderColor: `${action.color}33`,
            borderWidth: '1px',
          }}
        >
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${action.color}15`, color: action.color }}
          >
            {action.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-white">{action.title}</h4>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${action.color}20`,
                  color: action.color,
                }}
              >
                {action.priority}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#64748b' }}>
              {action.description}
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleComplete(action.id)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `${action.color}15` }}
              title="Mark complete"
            >
              <CheckCircle2 size={14} color={action.color} />
            </button>
            <button
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(99,102,241,0.1)' }}
              title="Take action"
            >
              <ArrowRight size={14} color="#6366f1" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
