import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from './ui/StatusBadge';
import Button from './ui/Button';
import FollowUpQuiz from './FollowUpQuiz';
import VerificationResult from './VerificationResult';
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
  GitCommit
} from 'lucide-react';

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

export default function DebtDetail({ debt, onStatusUpdate }) {
  if (!debt) return null;

  // Smart default tab logic based on debt lifecycle state
  const getDefaultTab = (status) => {
    switch (status) {
      case 'VERIFYING':
        return 'verify';
      case 'MENTOR_REVIEW':
      case 'IN_INTERVENTION':
      case 'FOLLOW_UP':
      case 'INTERVENTION_PROPOSED':
      case 'FAILED':
        return 'interventions';
      default:
        return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState(() => getDefaultTab(debt.status));
  const [verificationResult, setVerificationResult] = useState(null);
  const [showOlderInterventions, setShowOlderInterventions] = useState(false);

  const interventions = debt.interventions || [];
  const evidenceList = debt.evidence || [];
  const latestIntervention = interventions.length > 0 ? interventions[0] : null;
  const olderInterventions = interventions.length > 1 ? interventions.slice(1) : [];

  // Calculate active step for slim progress bar
  let activeStepIndex = ORDERED_LIFECYCLE_STEPS.findIndex(s => s.key === debt.status);
  if (activeStepIndex === -1) {
    if (debt.status === 'FAILED' || debt.status === 'REGRESSED') activeStepIndex = 5;
    else if (debt.status === 'ESCALATED') activeStepIndex = 4;
    else activeStepIndex = 0;
  }
  const progressPercent = debt.status === 'REPAID' ? 100 : Math.max(10, Math.min(100, Math.round(((activeStepIndex + 1) / ORDERED_LIFECYCLE_STEPS.length) * 100)));

  const handleQuizResult = (result) => {
    setVerificationResult(result);
    if (onStatusUpdate) {
      onStatusUpdate(debt.id, result.new_status || (result.passed ? 'REPAID' : 'FAILED'));
    }
  };

  // Keyboard navigation for tablist
  const handleKeyDown = (e, tabKey) => {
    const tabs = ['overview', 'verify', 'interventions', 'evidence'];
    const currentIndex = tabs.indexOf(tabKey);
    if (e.key === 'ArrowRight') {
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
    } else if (e.key === 'ArrowLeft') {
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prevTab);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200">
      
      {/* Compact Header: Concept Name, StatusBadge, attempts & failed count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-obsidian-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            {debt.concept}
          </h4>
          <StatusBadge status={debt.status} />
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Attempts: <strong className="text-slate-800 dark:text-white">{debt.attempts || 1}</strong>
          </span>
          {debt.failed_interventions > 0 && (
            <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/40">
              Failed Interventions: {debt.failed_interventions}
            </span>
          )}
        </div>
      </div>

      {/* Compact Tab Bar with Keyboard Accessibility */}
      <div 
        role="tablist" 
        aria-label="Debt Details Navigation"
        className="flex items-center gap-1 border-b border-slate-200 dark:border-obsidian-800 pb-0"
      >
        <button
          role="tab"
          id={`tab-overview-${debt.id}`}
          aria-selected={activeTab === 'overview'}
          aria-controls={`panel-overview-${debt.id}`}
          tabIndex={activeTab === 'overview' ? 0 : -1}
          onClick={() => setActiveTab('overview')}
          onKeyDown={(e) => handleKeyDown(e, 'overview')}
          className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer outline-none rounded-t-lg ${
            activeTab === 'overview'
              ? 'border-blue-500 dark:border-cyber-400 text-blue-700 dark:text-cyber-300 font-bold bg-blue-50 dark:bg-cyber-500/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-obsidian-900/50'
          }`}
        >
          Overview
        </button>

        <button
          role="tab"
          id={`tab-verify-${debt.id}`}
          aria-selected={activeTab === 'verify'}
          aria-controls={`panel-verify-${debt.id}`}
          tabIndex={activeTab === 'verify' ? 0 : -1}
          onClick={() => setActiveTab('verify')}
          onKeyDown={(e) => handleKeyDown(e, 'verify')}
          className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer outline-none rounded-t-lg flex items-center gap-1.5 ${
            activeTab === 'verify'
              ? 'border-blue-500 dark:border-cyber-400 text-blue-700 dark:text-cyber-300 font-bold bg-blue-50 dark:bg-cyber-500/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-obsidian-900/50'
          }`}
        >
          <span>Verify</span>
          {debt.status === 'VERIFYING' && (
            <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-cyber-400 animate-pulse" />
          )}
        </button>

        <button
          role="tab"
          id={`tab-interventions-${debt.id}`}
          aria-selected={activeTab === 'interventions'}
          aria-controls={`panel-interventions-${debt.id}`}
          tabIndex={activeTab === 'interventions' ? 0 : -1}
          onClick={() => setActiveTab('interventions')}
          onKeyDown={(e) => handleKeyDown(e, 'interventions')}
          className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer outline-none rounded-t-lg flex items-center gap-1.5 ${
            activeTab === 'interventions'
              ? 'border-blue-500 dark:border-cyber-400 text-blue-700 dark:text-cyber-300 font-bold bg-blue-50 dark:bg-cyber-500/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-obsidian-900/50'
          }`}
        >
          <span>Interventions</span>
          {interventions.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-slate-200 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-obsidian-700">
              {interventions.length}
            </span>
          )}
        </button>

        <button
          role="tab"
          id={`tab-evidence-${debt.id}`}
          aria-selected={activeTab === 'evidence'}
          aria-controls={`panel-evidence-${debt.id}`}
          tabIndex={activeTab === 'evidence' ? 0 : -1}
          onClick={() => setActiveTab('evidence')}
          onKeyDown={(e) => handleKeyDown(e, 'evidence')}
          className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer outline-none rounded-t-lg flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'border-blue-500 dark:border-cyber-400 text-blue-700 dark:text-cyber-300 font-bold bg-blue-50 dark:bg-cyber-500/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-obsidian-900/50'
          }`}
        >
          <span>Evidence</span>
          {evidenceList.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-slate-200 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-obsidian-700">
              {evidenceList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div 
          role="tabpanel"
          id={`panel-overview-${debt.id}`}
          aria-labelledby={`tab-overview-${debt.id}`}
          className="space-y-4 pt-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: Slim Lifecycle Progress & Why Flagged */}
            <div className="space-y-3">
              {/* Slim Lifecycle Progress Bar (~8px tall) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifecycle Progress</span>
                  <span className="font-bold text-blue-600 dark:text-cyber-400">{debt.status}</span>
                </div>
                
                {/* 8px progress bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-obsidian-950 rounded-full overflow-hidden border border-slate-200 dark:border-obsidian-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 dark:from-cyber-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                  <span>Detect</span>
                  <span>Intervene</span>
                  <span>Verify</span>
                  <span>Repay</span>
                </div>
              </div>

              {/* Compact "Why Flagged" Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-display">
                  <FileSearch className="w-3.5 h-3.5 text-blue-600 dark:text-cyber-400" />
                  <span>Why Flagged:</span>
                </div>
                
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  3 wrong answers · {evidenceList.length || 1} assessment items · below 60% mastery · {debt.attempts || 1} unresolved attempt{debt.attempts > 1 ? 's' : ''}
                </p>

                {debt.concept_id !== 'c-1' && (
                  <div className="text-[10px] font-mono text-blue-600 dark:text-cyber-300 font-medium flex items-center gap-1.5 pt-1.5 border-t border-slate-200 dark:border-obsidian-800">
                    <GitCommit className="w-3 h-3 text-blue-500 dark:text-cyber-400 shrink-0" />
                    <span>Prerequisite dependency concept contains related weakness</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Root Cause & Next Step */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-800 dark:text-white font-display">
                  Root Cause Explanation
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic font-sans">
                  "{debt.root_cause || `${debt.concept} depends on foundational prerequisite concepts where recent assessment evidence indicates an unresolved gap.`}"
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-cyber-950/30 border border-blue-200 dark:border-cyber-500/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-white font-display">Recommended Next Step</div>
                  <div className="text-[10px] text-blue-600 dark:text-cyber-300 font-mono">
                    {debt.status === 'VERIFYING' ? 'Active verification challenge ready' : 'Review AI intervention strategy'}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab(debt.status === 'VERIFYING' ? 'verify' : 'interventions')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {debt.status === 'VERIFYING' ? 'Start Verification' : 'View Strategy'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. VERIFY TAB */}
      {activeTab === 'verify' && (
        <div 
          role="tabpanel"
          id={`panel-verify-${debt.id}`}
          aria-labelledby={`tab-verify-${debt.id}`}
          className="space-y-3 pt-1"
        >
          {debt.status === 'VERIFYING' && debt.current_question && !verificationResult ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800">
              <FollowUpQuiz
                debtId={debt.id}
                question={debt.current_question}
                onResult={handleQuizResult}
              />
            </div>
          ) : verificationResult ? (
            <VerificationResult
              result={verificationResult}
              onReset={() => setVerificationResult(null)}
            />
          ) : debt.status === 'REPAID' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500 text-slate-800 dark:text-white flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-sm font-display">Debt Repaid & Verified Mastered</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">Evidence verification quiz passed cleanly. No further challenge active.</div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 text-center space-y-2">
              <HelpCircle className="w-6 h-6 text-blue-500 dark:text-cyber-400 mx-auto" />
              <div className="font-bold text-slate-800 dark:text-white font-display">Verification Challenge Not Active</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-sans">
                Current state is <strong className="text-slate-700 dark:text-white font-mono">{debt.status}</strong>. Verification unlocks automatically once intervention strategy is completed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. INTERVENTIONS TAB */}
      {activeTab === 'interventions' && (
        <div 
          role="tabpanel"
          id={`panel-interventions-${debt.id}`}
          aria-labelledby={`tab-interventions-${debt.id}`}
          className="space-y-3 pt-1"
        >
          {/* AI Recommendation Banner ONCE at top */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-cyber-500/10 border border-blue-200 dark:border-cyber-500/30 text-xs text-blue-700 dark:text-cyber-300 font-semibold font-mono">
            <Sparkles className="w-4 h-4 text-blue-500 dark:text-cyber-400 shrink-0 animate-pulse" />
            <span>AI Recommendation Proposal (Subject to Mentor Review & Evidence Verification)</span>
          </div>

          {latestIntervention ? (
            <div className="space-y-3">
              {/* Current / Latest Strategy Version */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-obsidian-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950 font-bold font-mono text-[10px]">
                      V{latestIntervention.version || 1} {latestIntervention.version > 1 ? '(Adapted)' : '(Initial)'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white font-display">
                      {latestIntervention.strategy || 'AI Personalized Remediation'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40">
                    {latestIntervention.mentor_status || 'Approved'}
                  </span>
                </div>

                {latestIntervention.version > 1 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/40 font-mono">
                    <strong>Adaptation Reason:</strong> {latestIntervention.version_note || 'Verification evidence showed previous V1 strategy did not sufficiently improve score. System adapted strategy to visual trace simulation.'}
                  </p>
                )}

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line p-3 bg-white dark:bg-obsidian-950 rounded-xl border border-slate-200 dark:border-obsidian-850 font-sans">
                  {typeof latestIntervention.content === 'object' && latestIntervention.content !== null
                    ? (latestIntervention.content.concept_explanation || latestIntervention.content.debugging_walkthrough || JSON.stringify(latestIntervention.content, null, 2))
                    : (latestIntervention.content || 'No intervention text provided.')}
                </div>
              </div>

              {/* Older Versions Accordion (Collapsed by default) */}
              {olderInterventions.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowOlderInterventions(!showOlderInterventions)}
                    className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-400" />
                    <span>{showOlderInterventions ? 'Hide' : 'View'} previous version{olderInterventions.length > 1 ? 's' : ''} ({olderInterventions.length})</span>
                    {showOlderInterventions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showOlderInterventions && (
                    <div className="mt-2 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-obsidian-800">
                      {olderInterventions.map((prevInt) => (
                        <div key={prevInt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-slate-800 dark:text-white font-mono">V{prevInt.version} — {prevInt.strategy}</span>
                            <span className="text-[10px] font-mono text-slate-400">{prevInt.mentor_status}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {typeof prevInt.content === 'object' && prevInt.content !== null
                              ? (prevInt.content.concept_explanation || prevInt.content.strategy || JSON.stringify(prevInt.content))
                              : String(prevInt.content || '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-obsidian-900/60 rounded-2xl border border-slate-200 dark:border-obsidian-800 font-mono">
              No active intervention strategy drafted yet.
            </div>
          )}
        </div>
      )}

      {/* 4. EVIDENCE TAB */}
      {activeTab === 'evidence' && (
        <div 
          role="tabpanel"
          id={`panel-evidence-${debt.id}`}
          aria-labelledby={`tab-evidence-${debt.id}`}
          className="space-y-3 pt-1"
        >
          {/* Decision Impact Header ONCE */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-obsidian-800">
            <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-cyber-400 shrink-0" />
            <span>Decision Impact: Evidence signals drive debt lifecycle state updates and adaptation triggers.</span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="p-5 text-center text-slate-400 bg-slate-50 dark:bg-obsidian-900/60 rounded-2xl border border-slate-200 dark:border-obsidian-800 font-mono">
              No evidence items recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-obsidian-850">
              {evidenceList.map((item, idx) => {
                const isPass = item.passed;
                return (
                  <div key={item.id || idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-400" />
                        <span className="font-bold text-slate-800 dark:text-white font-sans">{item.source}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isPass 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {isPass ? 'PASS' : 'FAIL'} ({item.score}%)
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    {item.detail && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-5 font-sans">
                        "{item.detail}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

