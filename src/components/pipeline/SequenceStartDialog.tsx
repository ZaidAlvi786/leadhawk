import React, { useState } from 'react';
import { Mail, ChevronRight, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type { EmailSequence } from '@/lib/types';

interface SequenceStartDialogProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  onClose: () => void;
}

export default function SequenceStartDialog({
  leadId,
  leadName,
  leadEmail,
  onClose,
}: SequenceStartDialogProps) {
  const { sequences, updatePipelineLead } = useStore();
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleStart = () => {
    if (!selectedSeq) {
      toast.error('Select a sequence');
      return;
    }
    setConfirming(true);
    try {
      const seq = sequences.find((s) => s.id === selectedSeq);
      updatePipelineLead(leadId, {
        sequenceId: selectedSeq,
        currentStep: 1,
      });
      toast.success(`Started ${seq?.name || 'sequence'} for ${leadName}`);
      onClose();
    } catch {
      toast.error('Failed to start sequence');
    }
    setConfirming(false);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleSkip}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div
          className="rounded-2xl p-6 space-y-4 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #F7F2E7 0%, #0a1428 100%)',
            border: '1px solid rgba(58,143,163,0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(58,143,163,0.15)' }}
              >
                <Mail size={18} color="#1E6F70" />
              </div>
              <div>
                <h3
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: 'Syne' }}
                >
                  Start Email Sequence
                </h3>
                <p className="text-xs" style={{ color: '#6E7F86' }}>
                  Auto-send emails to {leadName}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X size={14} color="#6E7F86" />
            </button>
          </div>

          {/* Lead Info */}
          <div
            className="p-3 rounded-lg"
            style={{ background: 'rgba(58,143,163,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#3A8FA3' }}
              />
              <span className="text-xs font-medium text-white">{leadName}</span>
            </div>
            <span className="text-xs" style={{ color: '#6E7F86' }}>
              {leadEmail}
            </span>
          </div>

          {/* Sequences List */}
          {sequences.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs" style={{ color: '#6E7F86' }}>
                No sequences created yet. Create one in the Email Sequences module.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sequences.map((seq) => (
                <button
                  key={seq.id}
                  onClick={() => setSelectedSeq(seq.id)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background:
                      selectedSeq === seq.id
                        ? 'rgba(58,143,163,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      selectedSeq === seq.id
                        ? 'rgba(58,143,163,0.3)'
                        : 'rgba(255,255,255,0.1)'
                    }`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div
                        className="text-sm font-medium text-white"
                        style={{ fontFamily: 'DM Sans' }}
                      >
                        {seq.name}
                      </div>
                      <div
                        className="text-xs mt-0.5 flex items-center gap-1.5"
                        style={{ color: '#6E7F86' }}
                      >
                        <span>{seq.steps.length} steps</span>
                        <span>•</span>
                        <span>{seq.tone}</span>
                      </div>
                    </div>
                    {selectedSeq === seq.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#3A8FA3' }}
                      >
                        <ChevronRight size={12} color="white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSkip}
              className="btn-secondary flex-1 text-sm"
            >
              Skip for Now
            </button>
            <button
              onClick={handleStart}
              disabled={!selectedSeq || confirming}
              className="btn-primary flex-1 text-sm"
            >
              {confirming ? 'Starting...' : 'Start Sequence'}
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-center" style={{ color: '#6E7F86' }}>
            You can link a sequence anytime from the lead's card
          </p>
        </div>
      </div>
    </>
  );
}
