import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatusBadge from '../components/ui/StatusBadge';
import InterventionCard from '../components/InterventionCard';
import { getStudentDebts } from '../services/api';
import { Sparkles } from 'lucide-react';

export default function InterventionsPage() {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    getStudentDebts('std-101').then(d => setDebts(d || []));
  }, []);

  const activeInterventions = debts.filter(d => d.interventions && d.interventions.length > 0);

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        category="Intervention Strategies"
        title="AI Remediation & V1 → V2 Strategy Adaptation"
        subtitle="AI-generated worked examples and visual trace exercises, adapted dynamically when verification evidence signals indicate incomplete mastery."
      />

      <div className="space-y-6">
        {activeInterventions.map((d) => (
          <Panel key={d.id} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{d.concept}</h3>
                <div className="mt-1">
                  <StatusBadge status={d.status} />
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                {d.interventions.length} Strategy Version{d.interventions.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {d.interventions.map((intItem) => (
                <InterventionCard key={intItem.id} intervention={intItem} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppLayout>
  );
}
