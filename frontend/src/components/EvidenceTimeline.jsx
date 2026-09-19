import React from 'react';
import { FileCode, Clock, ShieldCheck } from 'lucide-react';

export default function EvidenceTimeline({ evidenceList = [] }) {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 text-center">
        No evidence signals recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 my-2">
      {evidenceList.map((item, index) => {
        const isPass = item.passed;

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline node icon */}
            <div 
              className={`absolute -left-[23px] top-2 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center ${
                isPass ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>

            {/* Content card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-colors space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.source}
                  </span>
                  {item.concept && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                      {item.concept}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPass 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60' 
                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/60'
                  }`}>
                    {isPass ? 'PASS' : 'FAIL'} ({item.score})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.timestamp}</span>
                </div>

              </div>

              {item.detail && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-4 border-l-2 border-slate-200 dark:border-slate-700 italic">
                  "{item.detail}"
                </p>
              )}

              {/* Impact Note */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>
                  Decision Impact: {isPass ? 'Evidence supports concept resolution.' : 'Contributed to debt confirmation & intervention trigger.'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
