import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Metric from '../components/ui/Metric';
import Collapsible from '../components/ui/Collapsible';
import StatusBadge from '../components/ui/StatusBadge';
import { getStudentDebts } from '../services/api';
import { TrendingUp, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';

export default function ProgressPage() {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    getStudentDebts('std-101').then(d => setDebts(d || []));
  }, []);

  const concepts = [
    { name: 'Programming Basics', mastery: 100, status: 'REPAID' },
    { name: 'Arrays & Indexing', mastery: 85, status: 'SUSPECTED' },
    { name: 'Pointers & Memory', mastery: 55, status: 'MENTOR_REVIEW' },
    { name: 'Linked Lists', mastery: 40, status: 'VERIFYING' },
    { name: 'Trees & Graphs', mastery: 25, status: 'ESCALATED' }
  ];

  return (
    <AppLayout>
      <PageHeader
        category="Progress & Mastery"
        title="Academic Progress & Concept Mastery"
        subtitle="Real-time evaluation of concept mastery levels based on accumulated verification evidence signals."
      />

      <div className="space-y-4 text-xs">
        {/* Top Compact Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Overall Mastery" value="82%" icon={TrendingUp} statusColor="blue" trend="↑ 8%" trendDirection="down" />
          <Metric label="Concepts Repaid" value="8" icon={CheckCircle2} statusColor="emerald" />
          <Metric label="Active Debt Gaps" value="3" icon={AlertCircle} statusColor="amber" />
          <Metric label="Avg Attempts" value="1.8" icon={BookOpen} statusColor="purple" />
        </div>

        {/* 2 Columns: Left = Mastery Trend; Right = Resolution Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mastery Trend Progress Bars */}
          <Panel title="Prerequisite Concept Mastery Trend" subtitle="Percentage of verified mastery per topic">
            <div className="space-y-3">
              {concepts.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{c.mastery}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.mastery >= 80 ? 'bg-emerald-500' : c.mastery >= 50 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${c.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Resolution Metrics */}
          <Panel title="Resolution Efficiency" subtitle="Empirical resolution metrics">
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Total Knowledge Debts Resolved</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">8 concepts verified mastered via quiz challenge</div>
                </div>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">8</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Average Attempts to Repayment</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">V1 → V2 adaptation resolution efficiency</div>
                </div>
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">1.8</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Detailed Concept Breakdown Collapsed by Default */}
        <Collapsible title="detailed concept breakdown" icon={BookOpen}>
          <Panel noPadding>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-3">
              {concepts.map((c, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    <span className="font-bold text-blue-600 dark:text-blue-400">{c.mastery}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </Collapsible>
      </div>
    </AppLayout>
  );
}
