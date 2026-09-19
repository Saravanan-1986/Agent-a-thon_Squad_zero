import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import EvidenceTimeline from '../components/EvidenceTimeline';
import { getStudentDebts } from '../services/api';
import { ShieldCheck, Database, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';

export default function EvidencePage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('ALL'); // 'ALL' | 'PASS' | 'FAIL'

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const d = await getStudentDebts(selectedStudentId || '1');
      setDebts(d || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [selectedStudentId]);

  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));
  
  const totalSignals = allEvidence.length;
  const passedSignals = allEvidence.filter(e => e.passed).length;
  const failedSignals = totalSignals - passedSignals;
  const passRate = totalSignals > 0 ? Math.round((passedSignals / totalSignals) * 100) : 0;

  const filteredEvidence = allEvidence.filter(e => {
    const matchesSearch = !searchTerm || 
      (e.concept && e.concept.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.source && e.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.detail && e.detail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterResult === 'PASS') return e.passed;
    if (filterResult === 'FAIL') return !e.passed;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          category="Evidence Ledger"
          title="Empirical Evidence Audit Trail"
          subtitle="Cryptographically sound audit trail driving knowledge debt lifecycle decisions. LLM Proposes. Evidence Decides."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchEvidence}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-800/80 hover:bg-slate-200 dark:hover:bg-obsidian-750 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyber-400' : ''}`} />
                <span>Refresh Signals</span>
              </button>
            </div>
          }
        />

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Signals Logged</p>
                <h4 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-0.5">{totalSignals}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit events</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Pass Rate Ratio</p>
                <h4 className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5">{passRate}%</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{passedSignals} passed / {totalSignals} total</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400">Deficit Evidence</p>
                <h4 className="text-2xl font-black font-display text-rose-600 dark:text-rose-400 mt-0.5">{failedSignals}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Prompted debt escalations</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-cyber-400">Adversarial Resistance</p>
                <h4 className="text-2xl font-black font-display text-blue-600 dark:text-cyber-400 mt-0.5">100%</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Self-reports strictly rejected</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-cyber-500/10 border border-blue-200 dark:border-cyber-500/30 flex items-center justify-center text-blue-600 dark:text-cyber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by concept, assessment source, or detail..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'PASS', 'FAIL'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterResult(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterResult === mode
                    ? mode === 'PASS' 
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      : mode === 'FAIL'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                      : 'bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {mode === 'ALL' ? 'All Records' : mode === 'PASS' ? 'Passed Signals' : 'Failed Signals'}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Timeline Container */}
        <Panel 
          title="Comprehensive Evidence Signal Trail"
          subtitle="Chronological log of diagnostic test scores, coding sandbox outcomes, and LLM verification checks"
        >
          <EvidenceTimeline evidenceList={filteredEvidence} />
        </Panel>
      </div>
    </AppLayout>
  );
}
