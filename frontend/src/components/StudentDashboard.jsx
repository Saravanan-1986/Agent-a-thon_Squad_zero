import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Sparkles,
  GitCommit
} from 'lucide-react';
import DebtCard from './DebtCard';
import DebtGraph from './DebtGraph';

export default function StudentDashboard({ student, debts = [], onRefresh }) {
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | REPAID | ESCALATED
  const [viewMode, setViewMode] = useState('CARDS'); // CARDS | GRAPH

  const totalActive = debts.filter(d => d.status !== 'REPAID' && d.status !== 'CLEAR').length;
  const totalRepaid = debts.filter(d => d.status === 'REPAID').length;
  const totalEscalated = debts.filter(d => d.status === 'ESCALATED').length;

  const filteredDebts = debts.filter(d => {
    if (filter === 'ACTIVE') return d.status !== 'REPAID' && d.status !== 'CLEAR';
    if (filter === 'REPAID') return d.status === 'REPAID';
    if (filter === 'ESCALATED') return d.status === 'ESCALATED';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Student Profile & Macro Metric Summary Strip */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <img
            src={student?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={student?.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-100">
                {student?.name || 'Student Profile'}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                {student?.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {student?.major || 'Computer Science'} • {student?.year || 'Year 2'}
            </p>
          </div>
        </div>

        {/* Metric Summary Strip */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Active Debts</div>
            <div className="text-lg font-extrabold text-indigo-400 mt-0.5">{totalActive}</div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Repaid (Verified)</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{totalRepaid}</div>
          </div>

          <div className={`px-4 py-2.5 rounded-xl bg-slate-900/90 border text-center ${
            totalEscalated > 0 ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
          }`}>
            <div className="text-[10px] font-bold uppercase text-slate-400">Escalated</div>
            <div className={`text-lg font-extrabold mt-0.5 ${totalEscalated > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
              {totalEscalated}
            </div>
          </div>

        </div>

      </div>

      {/* View Mode & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Debts ({debts.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({totalActive})
          </button>
          <button
            onClick={() => setFilter('REPAID')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'REPAID' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Repaid ({totalRepaid})
          </button>
          <button
            onClick={() => setFilter('ESCALATED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ESCALATED' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Escalated ({totalEscalated})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setViewMode('CARDS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'CARDS' ? 'bg-slate-800 text-indigo-400 border border-slate-700' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ledger Cards</span>
          </button>
          <button
            onClick={() => setViewMode('GRAPH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'GRAPH' ? 'bg-slate-800 text-indigo-400 border border-slate-700' : 'text-slate-400'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>DAG Prerequisite View</span>
          </button>
        </div>

      </div>

      {/* DAG Graph View */}
      {viewMode === 'GRAPH' && (
        <DebtGraph studentDebts={debts} />
      )}

      {/* Ledger Cards View */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          {filteredDebts.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No debts found matching filter.</p>
              <p className="text-xs text-slate-500 mt-1">Select a different filter or check back later.</p>
            </div>
          ) : (
            filteredDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} onStatusUpdate={onRefresh} />
            ))
          )}
        </div>
      )}

    </div>
  );
}
