import React from 'react';
import { Sparkles, ShieldCheck, Clock, UserX, Lightbulb, History } from 'lucide-react';

export default function InterventionCard({ intervention }) {
  if (!intervention) return null;

  const isV2 = intervention.version > 1;

  const getMentorBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
          label: 'Mentor Approved',
          icon: ShieldCheck
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
          label: 'Mentor Rejected',
          icon: UserX
        };
      case 'ESCALATED':
        return {
          bg: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
          label: 'Human Escalate',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
          label: 'Pending Mentor Review',
          icon: Clock
        };
    }
  };

  const mentorCfg = getMentorBadge(intervention.mentor_status);
  const MentorIcon = mentorCfg.icon;

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
      
      {/* Explicit AI Recommendation Banner */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 font-semibold">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>AI Recommendation Proposal (Subject to Mentor Review & Evidence Verification)</span>
      </div>

      {/* Version Header & Adapt Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-blue-600 dark:bg-blue-500 text-white font-bold text-xs shadow-2xs flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            Strategy V{intervention.version || 1} {isV2 ? '(Adapted Strategy)' : '(Initial Strategy)'}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {intervention.strategy || 'AI Personalized Remediation'}
          </span>
        </div>

        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${mentorCfg.bg}`}>
          <MentorIcon className="w-3.5 h-3.5" />
          {mentorCfg.label}
        </span>
      </div>

      {/* Adaptation Reason Timeline (V1 -> V2) */}
      {isV2 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>V1 → V2 Adaptation Reason:</span>
          </div>
          <p className="text-[11px] text-amber-950 dark:text-amber-200 pl-5">
            {intervention.version_note || 'Verification evidence showed previous V1 strategy did not sufficiently improve score. System adapted strategy to visual trace simulation.'}
          </p>
        </div>
      )}

      {/* Content Text */}
      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-line font-sans">
        {intervention.content || 'No intervention text provided.'}
      </div>

    </div>
  );
}
