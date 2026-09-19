import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

  const [student, setStudent] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | HIGH_PRIORITY | INTERVENTION | REPAID
  const [viewMode, setViewMode] = useState('TABLE'); // TABLE | GRAPH
  const [expandedDebtId, setExpandedDebtId] = useState('debt-101-1');

  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await getStudent(id || 'std-101');
      const studentDebts = await getStudentDebts(id || 'std-101');
      setStudent(studentData);
      setDebts(studentDebts || []);
    } catch (err) {
      setError('Unable to load Knowledge Debt Ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

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
        title={`Student Ledger: ${student?.name || 'Arun Kumar'}`}
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
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs text-xs font-semibold">
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
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center text-rose-800 dark:text-rose-300 font-bold text-xs space-y-2">
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
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[700px] text-xs">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <div className="col-span-3">Concept & Topic</div>
                      <div className="col-span-2">Debt Score</div>
                      <div className="col-span-2">Severity</div>
                      <div className="col-span-2">Current Lifecycle</div>
                      <div className="col-span-2">Prerequisite Root</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>

                    {/* Table Rows with Progressive Disclosure */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredDebts.map(debt => {
                        const isExpanded = expandedDebtId === debt.id;
                        const score = debt.severity === 'CRITICAL' ? 90 : debt.severity === 'HIGH' ? 75 : debt.severity === 'MEDIUM' ? 55 : 30;

                        return (
                          <div key={debt.id} className="transition-all">
                            <div 
                              onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                              className={`grid grid-cols-12 gap-3 p-4 items-center cursor-pointer transition-colors ${
                                isExpanded 
                                  ? 'bg-blue-50/40 dark:bg-slate-850/80 font-medium' 
                                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/40'
                              }`}
                            >
                              <div className="col-span-3 font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {debt.concept}
                              </div>

                              <div className="col-span-2 font-extrabold text-blue-600 dark:text-blue-400 text-base">
                                {score}
                              </div>

                              <div className="col-span-2">
                                <StatusBadge status={debt.severity} />
                              </div>

                              <div className="col-span-2">
                                <StatusBadge status={debt.status} />
                              </div>

                              <div className="col-span-2 text-slate-500 dark:text-slate-400 italic">
                                {debt.concept_id === 'c-4' ? 'Pointers' : debt.concept_id === 'c-3' ? 'Arrays' : 'Basics'}
                              </div>

                              <div className="col-span-1 text-right">
                                <button 
                                  type="button"
                                  className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1"
                                  aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-b border-slate-200/80 dark:border-slate-800 transition-all">
                                <DebtDetail debt={debt} onStatusUpdate={fetchStudentData} />
                              </div>
                            )}
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
