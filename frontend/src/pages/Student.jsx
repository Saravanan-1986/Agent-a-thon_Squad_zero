import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getStudent, getStudentDebts } from '../services/api';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import DebtDetail from '../components/DebtDetail';
import DebtGraph from '../components/DebtGraph';
import { TableSkeleton, EmptyState } from '../components/SkeletonLoader';
import { RefreshCw, AlertCircle, BookOpen, Layers, GitCommit, ChevronDown, ChevronUp } from 'lucide-react';

export default function Student() {
  const { id } = useParams();
  const { selectedStudentId, setSelectedStudentId } = useAuth();
  const effectiveId = id || selectedStudentId || '1';

  const [student, setStudent] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | HIGH_PRIORITY | INTERVENTION | REPAID
  const [viewMode, setViewMode] = useState('TABLE'); // TABLE | GRAPH
  const [expandedDebtId, setExpandedDebtId] = useState(null);

  useEffect(() => {
    if (id && id !== selectedStudentId) {
      setSelectedStudentId(id);
    }
  }, [id]);

  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await getStudent(effectiveId);
      const studentDebts = await getStudentDebts(effectiveId);
      setStudent(studentData);
      setDebts(studentDebts || []);
      if (studentDebts && studentDebts.length > 0 && !expandedDebtId) {
        setExpandedDebtId(studentDebts[0].id);
      }
    } catch (err) {
      setError('Unable to load Knowledge Debt Ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [effectiveId]);

  const filteredDebts = debts.filter(d => {
    if (filter === 'ACTIVE') return d.status !== 'REPAID' && d.status !== 'CLEAR';
    if (filter === 'HIGH_PRIORITY') return d.severity === 'HIGH' || d.severity === 'CRITICAL' || d.status === 'ESCALATED';
    if (filter === 'INTERVENTION') return d.status === 'IN_INTERVENTION' || d.status === 'INTERVENTION_PROPOSED' || d.status === 'MENTOR_REVIEW';
    if (filter === 'REPAID') return d.status === 'REPAID';
    return true;
  });

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        category="Knowledge Debt Ledger"
        title={`Student Ledger: ${student?.name || 'Rahul Sharma'}`}
        subtitle="Track unresolved learning gaps, root causes, prerequisite dependencies, and verification evidence."
        actions={
          <Button variant="secondary" size="sm" onClick={fetchStudentData} icon={RefreshCw}>
            Refresh Ledger
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Filter Pills & View Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
            <Button
              variant={filter === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All ({debts.length})
            </Button>
            <Button
              variant={filter === 'ACTIVE' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('ACTIVE')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'HIGH_PRIORITY' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setFilter('HIGH_PRIORITY')}
            >
              High Priority
            </Button>
            <Button
              variant={filter === 'INTERVENTION' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('INTERVENTION')}
            >
              In Intervention
            </Button>
            <Button
              variant={filter === 'REPAID' ? 'success' : 'outline'}
              size="sm"
              onClick={() => setFilter('REPAID')}
            >
              Repaid
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-obsidian-900 p-1 rounded-xl border border-slate-200 dark:border-obsidian-800 shadow-inner text-xs font-semibold">
            <Button
              variant={viewMode === 'TABLE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('TABLE')}
              icon={Layers}
            >
              Analytical Table
            </Button>
            <Button
              variant={viewMode === 'GRAPH' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('GRAPH')}
              icon={GitCommit}
            >
              Prerequisite DAG
            </Button>
          </div>
        </div>

        {/* Render Graph or Table View */}
        {viewMode === 'GRAPH' ? (
          <DebtGraph studentDebts={debts} />
        ) : (
          <div className="space-y-4">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center text-rose-700 dark:text-rose-300 font-bold text-xs space-y-2">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                <p>{error}</p>
              </div>
            ) : filteredDebts.length === 0 ? (
              <EmptyState
                title="No Knowledge Debts Found"
                description="No unresolved learning gaps match the selected filter category."
                icon={BookOpen}
                actionLabel="Show All Debts"
                onAction={() => setFilter('ALL')}
              />
            ) : (
              <Panel noPadding className="overflow-hidden">
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <div className="min-w-[700px] text-xs">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-obsidian-950/80 font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-obsidian-800">
                      <div className="col-span-3">Concept & Topic</div>
                      <div className="col-span-2">Debt Score</div>
                      <div className="col-span-2">Severity</div>
                      <div className="col-span-2">Current Lifecycle</div>
                      <div className="col-span-2">Prerequisite Root</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>

                    {/* Table Rows with Progressive Disclosure */}
                    <div className="divide-y divide-slate-100 dark:divide-obsidian-850">
                      {filteredDebts.map(debt => {
                        const isExpanded = expandedDebtId === debt.id;
                        const score = debt.severity === 'CRITICAL' ? 90 : debt.severity === 'HIGH' ? 75 : debt.severity === 'MEDIUM' ? 55 : 30;

                        return (
                          <div key={debt.id} className="transition-all">
                            <div 
                              onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                              className={`grid grid-cols-12 gap-3 p-4 items-center cursor-pointer transition-colors ${
                                isExpanded 
                                  ? 'bg-blue-50 dark:bg-obsidian-900 text-slate-900 dark:text-white font-medium border-l-2 border-blue-500 dark:border-cyber-500' 
                                  : 'hover:bg-slate-50 dark:hover:bg-obsidian-900/50'
                              }`}
                            >
                              <div className="col-span-3 font-bold text-slate-900 dark:text-white text-sm font-display">
                                {debt.concept}
                              </div>

                              <div className="col-span-2 font-extrabold text-blue-600 dark:text-cyber-400 font-display text-base">
                                {score}
                              </div>

                              <div className="col-span-2">
                                <StatusBadge status={debt.severity} />
                              </div>

                              <div className="col-span-2">
                                <StatusBadge status={debt.status} />
                              </div>

                              <div className="col-span-2 text-slate-400 italic font-mono text-[11px]">
                                {debt.concept_id === 'c-4' ? 'Pointers' : debt.concept_id === 'c-3' ? 'Arrays' : 'Basics'}
                              </div>

                              <div className="col-span-1 text-right">
                                <button 
                                  type="button"
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 transition-colors"
                                  aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600 dark:text-cyber-400" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-5 bg-slate-50 dark:bg-obsidian-950 border-t border-b border-slate-100 dark:border-obsidian-800 transition-all"
                                >
                                  <DebtDetail debt={debt} onStatusUpdate={fetchStudentData} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

