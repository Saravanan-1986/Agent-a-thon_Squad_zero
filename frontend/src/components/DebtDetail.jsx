import React, { useState } from 'react';
import StatusBadge from './ui/StatusBadge';
import Button from './ui/Button';
import MarkdownRenderer from './ui/MarkdownRenderer';
import { stateLabel, stateDescription } from './ui/stateMapper';
import { 
  FileSearch, 
  Sparkles, 
  HelpCircle, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  FileCode,
  ShieldCheck,
  Check,
  ArrowRight,
  GitCommit,
  X
} from 'lucide-react';

export default function DebtDetail({ debt, onStatusUpdate }) {
  if (!debt) return null;

  const [activeTab, setActiveTab] = useState('overview');
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const interventions = debt.interventions || [];
  const evidenceList = debt.evidence || [];
  const latestIntervention = interventions.length > 0 ? interventions[0] : null;

  return (
    <div className="space-y-4 text-xs text-[#1B2150] dark:text-[#F1F5F9]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            {debt.concept}
          </h4>
          <StatusBadge status={debt.status} />
          <span className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
            Attempts: <strong className="text-[#1B2150] dark:text-white">{debt.attempts || 1}</strong>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-2">
        {['overview', 'interventions', 'evidence'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#EEECFF] text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#818CF8]'
                : 'text-[#5F6788] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-[#22295E] border border-slate-200/50 dark:border-white/5 space-y-2">
            <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] block">
              Topic Status Explanation
            </span>
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8] font-medium leading-relaxed">
              {stateDescription(debt.status)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-[#22295E] border border-slate-200/50 dark:border-white/5 space-y-1">
            <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] block">
              Root Cause Diagnosis
            </span>
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8] italic">
              "{debt.root_cause || `${debt.concept} requires reinforcement of prerequisite concepts.`}"
            </p>
          </div>
        </div>
      )}

      {activeTab === 'interventions' && (
        <div className="space-y-3">
          {latestIntervention ? (
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-[#22295E] border border-slate-200/50 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8]">
                  Strategy Version {latestIntervention.version || 'V1'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8FDF2] text-[#027A48]">
                  {latestIntervention.mentor_status || 'Approved'}
                </span>
              </div>
              <MarkdownRenderer
                content={
                  typeof latestIntervention.content === 'object'
                    ? (latestIntervention.content.concept_explanation || latestIntervention.content.debugging_walkthrough || JSON.stringify(latestIntervention.content, null, 2))
                    : (latestIntervention.content || 'No text provided.')
                }
              />
            </div>
          ) : (
            <p className="text-xs text-[#5F6788]">No intervention strategy recorded yet.</p>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="space-y-2">
          {evidenceList.length === 0 ? (
            <p className="text-xs text-[#5F6788]">No evidence logged for this concept.</p>
          ) : (
            evidenceList.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-100/70 dark:bg-[#22295E] flex items-center justify-between text-xs">
                <div>
                  <strong className="text-[#1B2150] dark:text-[#F1F5F9] font-bold block">{item.source}</strong>
                  <span className="text-[11px] text-[#8C94B2]">{item.timestamp}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${item.passed ? 'bg-[#E8FDF2] text-[#027A48]' : 'bg-[#FEE4E2] text-[#B42318]'}`}>
                  {item.score}%
                </span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
