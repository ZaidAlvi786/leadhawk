import React from 'react';
import { Mail, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type { PipelineLead } from '@/lib/types';

interface SequenceProgressDisplayProps {
  lead: PipelineLead;
}

export default function SequenceProgressDisplay({
  lead,
}: SequenceProgressDisplayProps) {
  const { sequences, updatePipelineLead } = useStore();

  if (!lead.sequenceId) return null;

  const seq = sequences.find((s) => s.id === lead.sequenceId);
  if (!seq) return null;

  const currentStep = lead.currentStep || 1;
  const totalSteps = seq.steps.length;
  const progress = (currentStep / totalSteps) * 100;
  const step = seq.steps[currentStep - 1];

  const handlePause = () => {
    updatePipelineLead(lead.id, {
      currentStep: currentStep | 0, // Keep same step, add paused flag if needed
    });
    toast.success('Sequence paused');
  };

  const handleRemove = () => {
    updatePipelineLead(lead.id, {
      sequenceId: undefined,
      currentStep: undefined,
    });
    toast.success('Sequence removed');
  };

  return (
    <div
      className="p-2.5 rounded-lg mb-2 space-y-2"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={12} color="#a5b4fc" />
          <span className="text-xs font-medium" style={{ color: '#a5b4fc' }}>
            {seq.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#64748b' }}>
            {currentStep}/{totalSteps}
          </span>
          <button
            onClick={handleRemove}
            className="w-4 h-4 flex items-center justify-center rounded"
            style={{ background: 'rgba(244,63,94,0.1)' }}
          >
            <X size={8} color="#f87171" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            background: '#6366f1',
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Current step info */}
      {step && (
        <div className="text-xs" style={{ color: '#cbd5e1' }}>
          <span className="font-medium">{step.subject}</span>
          <span className="text-gray-500"> — in {step.delayDays}d</span>
        </div>
      )}
    </div>
  );
}
