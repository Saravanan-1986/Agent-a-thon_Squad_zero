import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatusBadge from '../components/ui/StatusBadge';
import Collapsible from '../components/ui/Collapsible';
import { getStudentDebts } from '../services/api';
import { Sparkles, History, ChevronDown, ChevronUp } from 'lucide-react';

export default function InterventionsPage() {
  const [debts, setDebts] = useState([]);
  const [expandedConceptId, setExpandedConceptId] = useState(null);

  useEffect(() => {
    getStudentDebts('std-101').then(d => {
      const data = d || [];
      setDebts(data);
      if (data.length > 0) {
        setExpandedConceptId(data[0].id);
      }
    });
  }, []);

  const activeInterventions = debts.filter(d => d.interventions && d.interventions.length > 0);

  return (
    <AppLayout>
      <PageHeader
        category="Intervention Strategies"
        title="AI Remediation & V1 → V2 Strategy Adaptation"
        subtitle="AI-generated worked examples and visual trace exercises, adapted dynamically when verification evidence signals indicate incomplete mastery."
      />

      <div className="space-y-4 text-xs">
        {/* Single Top AI Proposal Disclaimer */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 font-semibold">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>AI Recommendation Proposal (Subject to Mentor Review & Evidence Verification)</span>
        </div>

        {/* Concept Rows List */}
        <div className="space-y-3">
          {activeInterventions.map((d) => {
            const isExpanded = expandedConceptId === d.id;
            const interventions = d.interventions || [];
            const latest = interventions[0];
            const older = interventions.slice(1);

            return (
              <Panel key={d.id} noPadding className="overflow-hidden">
                {/* Concept Header Row */}
                <div 
                  onClick={() => setExpandedConceptId(isExpanded ? null : d.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    isExpanded ? 'bg-blue-50/40 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{d.concept}</span>
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                      {interventions.length} Strategy Version{interventions.length > 1 ? 's' : ''}
                    </span>
                    <button type="button" className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Strategy Panel */}
                {isExpanded && latest && (
                  <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
                    {/* Latest Strategy Card */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-600 dark:bg-blue-500 text-white font-bold text-[10px]">
                            V{latest.version || 1} {latest.version > 1 ? '(Adapted)' : '(Initial)'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {latest.strategy || 'AI Remediation'}
                          </span>
                        </div>
                        <StatusBadge status={latest.mentor_status || 'Approved'} />
                      </div>

                      {latest.version > 1 && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/60">
                          <strong>V1 → V2 Adaptation Reason:</strong> {latest.version_note || 'Verification evidence indicated previous strategy did not improve score sufficiently.'}
                        </p>
                      )}

                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/60 dark:border-slate-800">
                        {latest.content}
                      </div>
                    </div>

                    {/* Older Versions Collapsible */}
                    {older.length > 0 && (
                      <Collapsible title={`previous version${older.length > 1 ? 's' : ''} (${older.length})`} icon={History}>
                        <div className="space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                          {older.map(prev => (
                            <div key={prev.id} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px]">V{prev.version} — {prev.strategy}</span>
                                <StatusBadge status={prev.mentor_status} />
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{prev.content}</p>
                            </div>
                          ))}
                        </div>
                      </Collapsible>
                    )}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
