import React from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerificationResult({ result, onReset }) {
  if (!result) return null;

  const isPass = result.passed;

  return (
    <div 
      className={`p-5 rounded-xl border transition-all ${
        isPass 
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' 
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-lg shrink-0 ${
          isPass ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
        }`}>
          {isPass ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isPass ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-300' : 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-300'
            }`}>
              {isPass ? 'VERIFICATION COMPLETE' : 'VERIFICATION INCOMPLETE'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Evidence Signal Logged
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {isPass ? '✓ Evidence Supports Concept Mastery → REPAID' : '⚠ The evidence does not yet support repayment.'}
          </h3>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {result.message}
          </p>

          {result.explanation && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Evaluation Feedback:</span>
              {result.explanation}
            </div>
          )}

          {!isPass && (
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 pt-1">
              <RefreshCw className="w-3.5 h-3.5" />
              The system will adapt the intervention strategy from V1 to V2.
            </p>
          )}

          {onReset && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onReset}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Continue Knowledge Debt Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
