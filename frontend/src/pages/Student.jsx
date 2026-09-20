import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getStudent, getStudentDebts } from '../services/api';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import DebtDetail from '../components/DebtDetail';
import DebtGraph from '../components/DebtGraph';
import { stateLabel, stateDescription } from '../components/ui/stateMapper';
import { RefreshCw, AlertCircle, BookOpen, Layers, GitCommit, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function Student() {
  const { id } = useParams();
  const { selectedStudentId, setSelectedStudentId } = useAuth();
  const effectiveId = id || selectedStudentId || '1';

  const [student, setStudent] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [filter, setFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('TABLE');
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
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] tracking-tight">
              Knowledge Debt Ledger
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6788] dark:text-[#94A3B8] font-medium mt-1">
              Complete topic history for {student?.name || 'Rahul Sharma'}. Click any row to view recommendations and evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold text-[#5F6788] dark:text-[#94A3B8] flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              {showDetails ? 'Hide Details' : 'Details'}
            </button>

            <Button variant="secondary" size="sm" onClick={fetchStudentData} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters & View Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
            <Button
              variant={filter === 'ALL' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All Topics ({debts.length})
            </Button>
            <Button
              variant={filter === 'ACTIVE' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('ACTIVE')}
            >
              Active Gaps
            </Button>
            <Button
              variant={filter === 'HIGH_PRIORITY' ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => setFilter('HIGH_PRIORITY')}
            >
              High Priority
            </Button>
            <Button
              variant={filter === 'REPAID' ? 'success' : 'ghost'}
              size="sm"
              onClick={() => setFilter('REPAID')}
            >
              Cleared
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#22295E] p-1 rounded-full text-xs font-bold">
            <Button
              variant={viewMode === 'TABLE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('TABLE')}
              icon={Layers}
            >
              Topics List
            </Button>
            <Button
              variant={viewMode === 'GRAPH' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('GRAPH')}
              icon={GitCommit}
            >
              Prerequisite Flow
            </Button>
          </div>
        </div>

        {/* Table or Graph */}
        {viewMode === 'GRAPH' ? (
          <DebtGraph studentDebts={debts} />
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#5F6788]">Loading topic ledger...</div>
            ) : filteredDebts.length === 0 ? (
              <div className="p-12 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 text-center text-xs text-[#5F6788]">
                No topics match the selected filter.
              </div>
            ) : (
              filteredDebts.map((debt) => {
                const isExpanded = expandedDebtId === debt.id;

                return (
                  <div key={debt.id} className="rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft overflow-hidden transition-all">
                    <div
                      onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                      className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#1B2150] dark:text-[#F1F5F9]">
                            {debt.concept}
                          </span>
                          <StatusBadge status={debt.status} />
                        </div>
                        <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
                          {stateDescription(debt.status)}
                        </p>

                        {showDetails && (
                          <div className="text-[11px] font-mono text-[#8C94B2] pt-1">
                            Internal ID: {debt.id} | Concept ID: {debt.concept_id}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8]">
                          {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-5 bg-slate-100/60 dark:bg-[#22295E]/50 border-t border-slate-200/80 dark:border-white/10"
                        >
                          <DebtDetail debt={debt} onStatusUpdate={fetchStudentData} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
