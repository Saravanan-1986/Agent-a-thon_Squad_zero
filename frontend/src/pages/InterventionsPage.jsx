import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatusBadge from '../components/ui/StatusBadge';
import InterventionCard from '../components/InterventionCard';
import { getStudentDebts } from '../services/api';
import { Sparkles, BrainCircuit, RefreshCw, Cpu, Layers, Filter } from 'lucide-react';

export default function InterventionsPage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'adapted' | 'mentor'

  const fetchDebts = async () => {
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
    fetchDebts();
  }, [selectedStudentId]);

  const activeInterventions = debts.filter(d => d.interventions && d.interventions.length > 0);
  const totalStrategies = activeInterventions.reduce((sum, d) => sum + (d.interventions?.length || 0), 0);
  const adaptedV2Count = activeInterventions.reduce(
    (sum, d) => sum + (d.interventions?.filter(i => (i.version || 1) > 1)?.length || 0), 
    0
  );

  const filteredDebts = activeInterventions.filter(d => {
    if (filterMode === 'adapted') {
      return d.interventions?.some(i => (i.version || 1) > 1);
    }
    if (filterMode === 'mentor') {
      return d.interventions?.some(i => i.mentor_status === 'APPROVED');
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          category="AI Remediation"
          title="Intervention Strategies & Adaptive Plans"
          subtitle="Autonomous strategy evolution from theoretical exposition (V1) to tactile hardware RAM trace simulation (V2)."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDebts}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-800/80 hover:bg-slate-200 dark:hover:bg-obsidian-750 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyber-400' : ''}`} />
                <span>Sync Plans</span>
              </button>
            </div>
          }
        />

        {/* Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Total AI Plans</p>
                <h4 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-0.5">{totalStrategies}</h4>
                <p className="text-[11px] text-slate-400 mt-1">Targeting {activeInterventions.length} distinct gaps</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-purple-600 dark:text-purple-400">V1 → V2 Adaptations</p>
                <h4 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-0.5">{adaptedV2Count}</h4>
                <p className="text-[11px] text-purple-600/80 dark:text-purple-300/80 mt-1">Multi-modal visual memory switches</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Human-in-Loop Status</p>
                <h4 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-0.5">Faculty Vetted</h4>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 mt-1">Mentor supervision enabled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Filter Strategy:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-obsidian-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {[
                { id: 'all', label: 'All Remediation' },
                { id: 'adapted', label: 'V2 Adapted Only' },
                { id: 'mentor', label: 'Mentor Approved' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    filterMode === tab.id
                      ? 'bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-400">
            Showing {filteredDebts.length} debt container{filteredDebts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Active Interventions List */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredDebts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2"
              >
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">No matching remediation strategies found.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Try changing the filter or trigger a new diagnostic assessment.</p>
              </motion.div>
            ) : (
              filteredDebts.map((d, index) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Panel className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">{d.concept}</h3>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Debt ID: <span className="text-slate-700 dark:text-slate-300">{d.id}</span> • Severity: <span className="text-amber-600 dark:text-amber-400">{d.severity}</span>
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold font-mono">
                        {d.interventions.length} Generation Cycle{d.interventions.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {d.interventions.map((intItem) => (
                        <InterventionCard key={intItem.id} intervention={intItem} />
                      ))}
                    </div>
                  </Panel>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
