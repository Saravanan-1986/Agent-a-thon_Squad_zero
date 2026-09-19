import React, { useState } from 'react';
import { PREREQUISITE_CHAIN } from '../mocks/mockData';
import { GitCommit, ArrowRight, Info } from 'lucide-react';

export default function DebtGraph({ studentDebts = [] }) {
  const [selectedConcept, setSelectedConcept] = useState(null);

  const getDebtForConcept = (conceptName) => {
    return studentDebts.find(
      (d) => d.concept.toLowerCase().includes(conceptName.toLowerCase()) ||
             conceptName.toLowerCase().includes(d.concept.toLowerCase())
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Graph Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Prerequisite Dependency & Root-Cause Graph (DAG)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trace foundational root causes back through prerequisite concept chains.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            ✓ Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500"></span>
            ⚠ Active Debt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            ○ Escalated
          </span>
        </div>
      </div>

      {/* DAG Flow Visualizer */}
      <div className="relative overflow-x-auto py-6 px-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between min-w-[750px] gap-3">
          {PREREQUISITE_CHAIN.map((node, index) => {
            const debt = getDebtForConcept(node.name);
            const isRepaid = debt && debt.status === 'REPAID';
            const isHealthy = !debt || isRepaid;
            const isEscalated = debt && debt.status === 'ESCALATED';
            const isSelected = selectedConcept?.id === node.id;

            return (
              <React.Fragment key={node.id}>
                {/* Connector Arrow */}
                {index > 0 && (
                  <div className="flex-1 flex items-center justify-center relative">
                    <div className={`w-full h-0.5 ${isHealthy ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-300 dark:bg-blue-800'}`} />
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute" />
                  </div>
                )}

                {/* Node Card */}
                <div
                  onClick={() => setSelectedConcept({ ...node, debt })}
                  className={`cursor-pointer transition-all duration-200 p-3.5 rounded-xl border min-w-[130px] text-center ${
                    isSelected 
                      ? 'ring-2 ring-blue-600 dark:ring-blue-400 border-blue-600 bg-white dark:bg-slate-900 shadow-md' 
                      : isHealthy
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-300 hover:bg-emerald-100/50'
                      : isEscalated
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-300 hover:bg-rose-100/50'
                      : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-300 hover:bg-blue-100/50'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Level {node.level}
                  </div>
                  
                  <div className="text-xs font-bold truncate">
                    {node.name}
                  </div>
                  
                  <div className="mt-2 flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isHealthy 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' 
                        : isEscalated
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700'
                        : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
                    }`}>
                      {isHealthy ? '✓ Healthy' : isEscalated ? '○ Escalated' : '⚠ Active Debt'}
                    </span>
                  </div>

                  {debt && (
                    <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      State: {debt.status}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Panel */}
      {selectedConcept && (
        <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Dependency & Root-Cause Details: {selectedConcept.name}
            </h4>
            <button 
              onClick={() => setSelectedConcept(null)} 
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          
          <p className="text-slate-300">
            Prerequisites: {selectedConcept.prerequisites.length > 0 
              ? selectedConcept.prerequisites.map(pId => PREREQUISITE_CHAIN.find(c => c.id === pId)?.name).join(', ') 
              : 'None (Foundation Concept)'
            }
          </p>

          {selectedConcept.debt ? (
            <div className="p-3 rounded-lg bg-slate-950 dark:bg-slate-900 border border-slate-800 text-slate-200">
              <span className="font-semibold text-amber-400 block mb-0.5">Root Cause Explanation:</span>
              <p className="italic text-slate-300">
                "{selectedConcept.name} depends on foundational concepts where recent assessment evidence indicates an unresolved gap."
              </p>
            </div>
          ) : (
            <p className="text-emerald-400 font-semibold">
              ✓ Concept verified healthy. No active debt detected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
