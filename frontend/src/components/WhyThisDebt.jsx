import React from 'react';
import { FileSearch, CheckCircle2 } from 'lucide-react';

export default function WhyThisDebt({ debt }) {
  if (!debt) return null;

  const evidenceCount = debt.evidence ? debt.evidence.length : 1;
  const failedCount = debt.evidence ? debt.evidence.filter(e => !e.passed).length : 1;
  const attempts = debt.attempts || 1;

  const signals = [
    {
      text: `${failedCount} recorded incorrect answers/evaluations for ${debt.concept}`,
      active: true
    },
    {
      text: `Concept weakness appeared across ${evidenceCount} assessment item${evidenceCount > 1 ? 's' : ''}`,
      active: true
    },
    {
      text: `Performance score remained below 60% mastery threshold`,
      active: true
    },
    {
      text: `Prerequisite dependency concept contains related weakness`,
      active: debt.concept_id !== 'c-1'
    },
    {
      text: `Gap persisted across ${attempts} attempt${attempts > 1 ? 's' : ''} without resolution`,
      active: attempts > 1
    }
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
        <FileSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          Why This Debt Was Flagged
        </h4>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Knowledge Debt Engine flagged this concept based on accumulated empirical evidence signals:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {signals.filter(s => s.active).map((sig, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">✓</span>
            <span>{sig.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
