import React from 'react';
import { Check, RefreshCw, ShieldAlert, AlertTriangle } from 'lucide-react';

const ORDERED_LIFECYCLE_STEPS = [
  { key: 'CLEAR', label: 'Clear' },
  { key: 'SUSPECTED', label: 'Suspected' },
  { key: 'CONFIRMED_DEBT', label: 'Confirmed' },
  { key: 'INTERVENTION_PROPOSED', label: 'Proposed' },
  { key: 'MENTOR_REVIEW', label: 'Mentor Review' },
  { key: 'IN_INTERVENTION', label: 'In Progress' },
  { key: 'FOLLOW_UP', label: 'Follow Up' },
  { key: 'VERIFYING', label: 'Verifying' },
  { key: 'REPAID', label: 'Repaid' }
];

export default function LifecycleStepper({ currentStatus }) {
  const isFailed = currentStatus === 'FAILED';
  const isEscalated = currentStatus === 'ESCALATED';
  const isRegressed = currentStatus === 'REGRESSED';

  let activeIndex = ORDERED_LIFECYCLE_STEPS.findIndex(s => s.key === currentStatus);
  if (activeIndex === -1) {
    if (isFailed || isRegressed) activeIndex = 5;
    if (isEscalated) activeIndex = 4;
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
        <span className="uppercase tracking-wider">Knowledge Debt Lifecycle</span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          State: <span className="text-blue-600 dark:text-blue-400">{currentStatus}</span>
        </span>
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:flex items-center justify-between relative py-2">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />

        {ORDERED_LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex || currentStatus === 'REPAID';
          const isCurrent = idx === activeIndex && currentStatus !== 'REPAID';

          let stepBg = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500';
          let icon = <span className="text-[10px] font-bold">{idx + 1}</span>;

          if (isCompleted) {
            stepBg = 'bg-emerald-500 border-emerald-500 text-white shadow-xs';
            icon = <Check className="w-3 h-3 stroke-[3]" />;
          } else if (isCurrent) {
            if (isFailed) {
              stepBg = 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-md ring-4 ring-amber-100 dark:ring-amber-950';
              icon = <RefreshCw className="w-3 h-3 animate-spin" />;
            } else if (isEscalated) {
              stepBg = 'bg-rose-600 border-rose-600 text-white font-bold shadow-md ring-4 ring-rose-100 dark:ring-rose-950';
              icon = <ShieldAlert className="w-3 h-3" />;
            } else if (isRegressed) {
              stepBg = 'bg-purple-600 border-purple-600 text-white font-bold shadow-md ring-4 ring-purple-100 dark:ring-purple-950';
              icon = <AlertTriangle className="w-3 h-3" />;
            } else {
              stepBg = 'bg-blue-600 border-blue-600 text-white font-bold shadow-md ring-4 ring-blue-100 dark:ring-blue-950';
              icon = <span className="w-2 h-2 rounded-full bg-white animate-ping" />;
            }
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${stepBg}`}>
                {icon}
              </div>
              <span className={`text-[10px] mt-1.5 font-semibold whitespace-nowrap transition-colors ${
                isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Compact Stepper */}
      <div className="md:hidden flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <span className="font-bold text-slate-900 dark:text-slate-100">Phase:</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{currentStatus}</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
          Step {activeIndex >= 0 ? activeIndex + 1 : 1} of 9
        </span>
      </div>
    </div>
  );
}
