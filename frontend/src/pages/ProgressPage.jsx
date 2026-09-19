import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Metric from '../components/ui/Metric';
import { getStudentDebts } from '../services/api';
import { TrendingUp, CheckCircle2, BookOpen } from 'lucide-react';

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
      {/* Header */}
      <PageHeader
        category="Progress & Mastery"
        title="Academic Progress & Concept Mastery"
        subtitle="Real-time evaluation of concept mastery levels based on accumulated verification evidence signals."
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Concept Mastery Bars */}
          <Panel title="Prerequisite Concept Mastery Trend" subtitle="Percentage of verified mastery per topic">
            <div className="space-y-4">
              {concepts.map((c, i) => (
                <div key={i} className="space-y-1.5">
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

          {/* Repayment Stats */}
          <Panel title="Knowledge Debt Resolution Metrics" subtitle="Empirical resolution metrics">
            <div className="space-y-4">
              <Metric
                label="Total Debts Resolved"
                value="8 Concepts"
                subtext="Verified through evidence quiz challenges"
                icon={CheckCircle2}
                statusColor="emerald"
              />

              <Metric
                label="Average Verification Attempts"
                value="1.8 Attempts"
                subtext="System V1 → V2 strategy adaptation efficiency"
                icon={BookOpen}
                statusColor="blue"
              />
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
