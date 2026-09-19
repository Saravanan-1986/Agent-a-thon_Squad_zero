import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import EvidenceTimeline from '../components/EvidenceTimeline';
import { getStudentDebts } from '../services/api';
import { ShieldCheck } from 'lucide-react';

export default function EvidencePage() {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    getStudentDebts('std-101').then(d => setDebts(d || []));
  }, []);

  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));

  return (
    <AppLayout>
      {/* Header */}
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

      <Panel>
        <EvidenceTimeline evidenceList={allEvidence} />
      </Panel>
    </AppLayout>
  );
}
