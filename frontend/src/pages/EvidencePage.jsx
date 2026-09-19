import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Timeline from '../components/ui/Timeline';
import { getStudentDebts } from '../services/api';
import { ShieldCheck, Filter } from 'lucide-react';

export default function EvidencePage() {
  const [debts, setDebts] = useState([]);
  const [conceptFilter, setConceptFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  useEffect(() => {
    getStudentDebts('std-101').then(d => setDebts(d || []));
  }, []);

  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));
  allEvidence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const filteredEvidence = allEvidence.filter(item => {
    if (conceptFilter !== 'ALL' && item.concept !== conceptFilter) return false;
    if (resultFilter === 'PASS' && !item.passed) return false;
    if (resultFilter === 'FAIL' && item.passed) return false;
    return true;
  });

  const uniqueConcepts = Array.from(new Set(allEvidence.map(e => e.concept)));

  return (
    <AppLayout>
      <PageHeader
        category="Evidence Audit Trail"
        title="Comprehensive Evidence Signal Trail"
        subtitle="Empirical records driving knowledge debt lifecycle decisions. LLM Proposes. Evidence Decides."
        actions={
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Verified Empirical Signals
          </span>
        }
      />

      <div className="space-y-4 text-xs">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Filter Evidence:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Concept Filter Dropdown */}
            <select
              value={conceptFilter}
              onChange={(e) => setConceptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
            >
              <option value="ALL">All Concepts</option>
              {uniqueConcepts.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Pass/Fail Filter Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={resultFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setResultFilter('ALL')}
              >
                All ({allEvidence.length})
              </Button>
              <Button
                variant={resultFilter === 'PASS' ? 'success' : 'outline'}
                size="sm"
                onClick={() => setResultFilter('PASS')}
              >
                Pass Only
              </Button>
              <Button
                variant={resultFilter === 'FAIL' ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setResultFilter('FAIL')}
              >
                Fail Only
              </Button>
            </div>
          </div>
        </div>

        {/* Filtered Timeline */}
        <Panel>
          <Timeline items={filteredEvidence} />
        </Panel>
      </div>
    </AppLayout>
  );
}
