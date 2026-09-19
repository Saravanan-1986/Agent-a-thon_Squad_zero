import React, { useState } from 'react';
import StatusBadge from './ui/StatusBadge';
import Button from './ui/Button';
import Tabs from './ui/Tabs';
import Collapsible from './ui/Collapsible';
import SummaryChips from './ui/SummaryChips';
import Timeline from './ui/Timeline';
import FollowUpQuiz from './FollowUpQuiz';
import VerificationResult from './VerificationResult';
import { 
  FileSearch, 
  Sparkles, 
  HelpCircle, 
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

  const interventions = debt.interventions || [];
  const evidenceList = debt.evidence || [];
  const latestIntervention = interventions.length > 0 ? interventions[0] : null;
  const olderInterventions = interventions.length > 1 ? interventions.slice(1) : [];

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

  const tabItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'verify', label: 'Verify', badge: debt.status === 'VERIFYING' },
    { key: 'interventions', label: 'Interventions', count: interventions.length },
    { key: 'evidence', label: 'Evidence', count: evidenceList.length },
  ];

  const summaryChipsData = [
    { text: '3 wrong answers', variant: 'danger' },
    { text: `${evidenceList.length || 1} assessment items`, variant: 'default' },
    { text: 'below 60% threshold', variant: 'warning' },
    { text: `${debt.attempts || 1} unresolved attempt${debt.attempts > 1 ? 's' : ''}`, variant: 'info' }
  ];

  return (
    <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {debt.concept}
          </h4>
          <StatusBadge status={debt.status} />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Attempts: <strong className="text-slate-900 dark:text-slate-100">{debt.attempts || 1}</strong>
          </span>
          {debt.failed_interventions > 0 && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
              Failed Interventions: {debt.failed_interventions}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabItems}
        activeTab={activeTab}
        onChange={(k) => setActiveTab(k)}
      />

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {/* Slim Lifecycle Bar */}
              <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifecycle Progress</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{debt.status}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                  <span>Detect</span>
                  <span>Intervene</span>
                  <span>Verify</span>
                  <span>Repay</span>
                </div>
              </div>

              {/* Compact Why Flagged */}
              <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Why Flagged:</span>
                </div>
                <SummaryChips items={summaryChipsData} />
                {debt.concept_id !== 'c-1' && (
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <GitCommit className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>Prerequisite dependency concept contains related weakness</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Root Cause Explanation</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{debt.root_cause || `${debt.concept} depends on foundational prerequisite concepts where recent assessment evidence indicates an unresolved gap.`}"
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-blue-900 dark:text-blue-200">Recommended Next Step</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-300">
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
        <div className="space-y-3 pt-1">
          {debt.status === 'VERIFYING' && debt.current_question && !verificationResult ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
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
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">Debt Repaid & Verified Mastered</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Evidence verification quiz passed cleanly. No further challenge active.</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto" />
              <div className="font-bold text-slate-800 dark:text-slate-200">Verification Challenge Not Active</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Current state is <strong>{debt.status}</strong>. Verification unlocks automatically once intervention strategy is completed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. INTERVENTIONS TAB */}
      {activeTab === 'interventions' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>AI Recommendation Proposal (Subject to Mentor Review & Evidence Verification)</span>
          </div>

          {latestIntervention ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 dark:bg-blue-500 text-white font-bold text-[10px]">
                      V{latestIntervention.version || 1} {latestIntervention.version > 1 ? '(Adapted)' : '(Initial)'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {latestIntervention.strategy || 'AI Personalized Remediation'}
                    </span>
                  </div>
                  <StatusBadge status={latestIntervention.mentor_status || 'Approved'} />
                </div>

                {latestIntervention.version > 1 && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/60">
                    <strong>Adaptation Reason:</strong> {latestIntervention.version_note || 'Verification evidence showed previous V1 strategy did not sufficiently improve score. System adapted strategy to visual trace simulation.'}
                  </p>
                )}

                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800">
                  {latestIntervention.content}
                </div>
              </div>

              {olderInterventions.length > 0 && (
                <Collapsible title={`previous version${olderInterventions.length > 1 ? 's' : ''} (${olderInterventions.length})`}>
                  <div className="space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                    {olderInterventions.map((prevInt) => (
                      <div key={prevInt.id} className="p-3 rounded-lg bg-slate-100/60 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px]">V{prevInt.version} — {prevInt.strategy}</span>
                          <StatusBadge status={prevInt.mentor_status} />
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{prevInt.content}</p>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 rounded-lg">
              No active intervention strategy drafted yet.
            </div>
          )}
        </div>
      )}

      {/* 4. EVIDENCE TAB */}
      {activeTab === 'evidence' && (
        <div className="space-y-3 pt-1">
          <Timeline items={evidenceList} />
        </div>
      )}
    </div>
  );
}
