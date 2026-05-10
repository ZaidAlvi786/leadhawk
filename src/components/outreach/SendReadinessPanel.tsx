// This component exists because: the brief calls for a pre-flight check before
// the user copies a message. The point is to make a bad message *visibly* bad
// at compose-time, not after 50 of them go out unanswered. Override is allowed
// (the user is the human in the loop) but each failure is shown inline.

import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import type { SendReadinessReport, CheckResult } from '@/lib/types';

interface Props {
  report: SendReadinessReport;
}

export default function SendReadinessPanel({ report }: Props) {
  const items: { key: keyof SendReadinessReport; label: string; result: CheckResult }[] = [
    { key: 'underLengthLimit',     label: 'Under 300 chars',                       result: report.underLengthLimit },
    { key: 'hasSpecificReference', label: 'Specific reference cites a source',     result: report.hasSpecificReference },
    { key: 'noBannedPhrases',      label: 'No banned phrases',                     result: report.noBannedPhrases },
    { key: 'doesNotStartWithI',    label: 'Doesn\'t start with "I"',                result: report.doesNotStartWithI },
    { key: 'ctaIsLowFriction',     label: 'Low-friction CTA',                      result: report.ctaIsLowFriction },
  ];
  const allPass = report.passed === report.total;

  return (
    <div className="rounded-lg p-3" style={{
      background: allPass ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.05)',
      border: `1px solid ${allPass ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {allPass
            ? <Check size={13} color="#10b981" />
            : <AlertCircle size={13} color="#fcd34d" />}
          <span className="text-xs font-semibold" style={{
            color: allPass ? '#6ee7b7' : '#fcd34d',
            fontFamily: 'Syne',
          }}>
            Send-readiness · {report.passed}/{report.total} {allPass ? 'all clear' : 'checks failing'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-2">
            {item.result.ok
              ? <Check size={11} color="#10b981" className="flex-shrink-0 mt-0.5" />
              : <X size={11} color="#f87171" className="flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <span className="text-xs" style={{ color: item.result.ok ? '#94a3b8' : '#cbd5e1' }}>
                {item.label}
              </span>
              {!item.result.ok && item.result.reason && (
                <span className="text-xs ml-1.5" style={{ color: '#f87171' }}>
                  — {item.result.reason}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
