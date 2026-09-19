import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileSearch, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import LifecycleStepper from './LifecycleStepper';
import WhyThisDebt from './WhyThisDebt';
import EvidenceTimeline from './EvidenceTimeline';
import InterventionCard from './InterventionCard';
import FollowUpQuiz from './FollowUpQuiz';
import VerificationResult from './VerificationResult';
import StatusBadge from './ui/StatusBadge';
import Button from './ui/Button';

export default function DebtCard({ debt, onStatusUpdate }) {
  const [isExpanded, setIsExpanded] = useState(debt.status === 'VERIFYING' || debt.status === 'ESCALATED');
  const [verificationResult, setVerificationResult] = useState(null);

  const debtScore = debt.severity === 'CRITICAL' ? 90 : debt.severity === 'HIGH' ? 75 : debt.severity === 'MEDIUM' ? 55 : 30;

  const handleQuizResult = (result) => {
    setVerificationResult(result);
    if (onStatusUpdate) {
      onStatusUpdate(debt.id, result.new_status || (result.passed ? 'REPAID' : 'FAILED'));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 transition-colors space-y-4">
      
      {/* Top Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        
        <div className="flex items-start gap-3.5">
          <StatusBadge status={debt.status} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {debt.concept}
              </h3>
              <StatusBadge status={debt.severity || 'LOW'} />
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Attempts: <strong className="text-slate-900 dark:text-slate-100">{debt.attempts || 1}</strong></span>
              {debt.failed_interventions > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">Failed Interventions: {debt.failed_interventions}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Debt Score & Expand Action */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Debt Score</div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{debtScore}</div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? ChevronUp : ChevronDown}
            iconPosition="right"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </Button>
        </div>
      </div>

      {/* Reusable Lifecycle Stepper */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <LifecycleStepper currentStatus={debt.status} />
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-6">
          
          {/* Why This Debt Explanation */}
          <WhyThisDebt debt={debt} />

          {/* Verification Quiz Flow */}
          {debt.status === 'VERIFYING' && debt.current_question && !verificationResult && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
              <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Active Verification Challenge
              </h4>
              <FollowUpQuiz 
                debtId={debt.id} 
                question={debt.current_question} 
                onResult={handleQuizResult} 
              />
            </div>
          )}

          {/* Verification Result Feedback */}
          {verificationResult && (
            <VerificationResult 
              result={verificationResult} 
              onReset={() => setVerificationResult(null)} 
            />
          )}

          {/* Intervention History & Strategy Adaptation */}
          {debt.interventions && debt.interventions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Intervention History ({debt.interventions.length} Version{debt.interventions.length > 1 ? 's' : ''})
              </h4>
              {debt.interventions.map((intItem) => (
                <InterventionCard key={intItem.id} intervention={intItem} />
              ))}
            </div>
          )}

          {/* Evidence Trail */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Evidence Trail (Accumulated Signals)
            </h4>
            <EvidenceTimeline evidenceList={debt.evidence || []} />
          </div>

        </div>
      )}

    </div>
  );
}
