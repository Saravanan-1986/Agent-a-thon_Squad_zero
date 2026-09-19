import React from 'react';
import { FileCode, Clock, ShieldCheck } from 'lucide-react';

export default function Timeline({
  items = [],
  headerNote = "Decision Impact: Evidence signals drive debt lifecycle state updates and adaptation triggers.",
  maxItems,
  onViewAll,
  className = '',
}) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className={`space-y-3 ${className}`}>
      {headerNote && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{headerNote}</span>
        </div>
      )}

      {displayItems.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
          No records logged yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {displayItems.map((item, idx) => {
            const isPass = item.passed;
            return (
              <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.concept || item.source}</span>
                    {item.concept && item.source && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">• {item.source}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPass 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    }`}>
                      {isPass ? 'PASS' : 'FAIL'} ({item.score})
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                </div>

                {item.detail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-5">
                    "{item.detail}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {maxItems && items.length > maxItems && onViewAll && (
        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all ({items.length}) →
          </button>
        </div>
      )}
    </div>
  );
}
