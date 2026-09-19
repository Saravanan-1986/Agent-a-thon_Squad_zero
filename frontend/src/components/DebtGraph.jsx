import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCommit, 
  ArrowRight, 
  Info, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Search,
  Activity,
  History,
  Layers,
  ChevronRight,
  Zap
} from 'lucide-react';
import { getKnowledgeGraph } from '../services/api';

export default function DebtGraph({ studentId = 1, activeCausalPath = null }) {
  const [graphData, setGraphData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [simulatedPath, setSimulatedPath] = useState(activeCausalPath);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      try {
        const data = await getKnowledgeGraph(studentId);
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [studentId]);

  useEffect(() => {
    if (activeCausalPath) {
      setSimulatedPath(activeCausalPath);
    }
  }, [activeCausalPath]);

  if (loading || !graphData) {
    return (
      <div className="bg-white dark:glass-panel rounded-3xl p-10 border border-slate-200 dark:border-obsidian-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
        <GitCommit className="w-8 h-8 mx-auto text-blue-500 dark:text-cyber-400 animate-spin" />
        <p className="font-mono">Loading 46-Concept Prerequisite Knowledge DAG...</p>
      </div>
    );
  }

  const { nodes = [], edges = [], categories = [] } = graphData;

  const filteredNodes = nodes.filter((n) => {
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPrerequisitesForNode = (nodeId) => {
    const prereqIds = edges.filter(e => e.target === nodeId).map(e => e.source);
    return nodes.filter(n => prereqIds.includes(n.id));
  };

  const getDependentsForNode = (nodeId) => {
    const depIds = edges.filter(e => e.source === nodeId).map(e => e.target);
    return nodes.filter(n => depIds.includes(n.id));
  };

  const isNodeInCausalPath = (nodeName) => {
    if (!simulatedPath || !Array.isArray(simulatedPath)) return false;
    return simulatedPath.some(p => 
      p.toLowerCase().includes(nodeName.toLowerCase()) || 
      nodeName.toLowerCase().includes(p.toLowerCase())
    );
  };

  const handleToggleSimulation = () => {
    if (simulatedPath) {
      setSimulatedPath(null);
    } else {
      setSimulatedPath(['Linked List Traversal', 'Pointer Dereferencing', 'Memory Model & Stack/Heap']);
    }
  };

  return (
    <div className="bg-white dark:glass-panel rounded-3xl p-6 border border-slate-200 dark:border-obsidian-750 shadow-xl space-y-5 text-slate-900 dark:text-white">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5 font-display">
            <GitCommit className="w-5 h-5 text-blue-600 dark:text-cyber-400" />
            Live Prerequisite Dependency DAG ({nodes.length} Concepts, {edges.length} Directed Edges)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Graph-native causality engine: traces downstream mistakes back to root foundational gaps.
          </p>
        </div>

        {/* Legend & Simulation Trigger */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleToggleSimulation}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              simulatedPath
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 animate-pulse'
                : 'bg-slate-100 dark:bg-obsidian-850 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-obsidian-700 hover:border-blue-500 dark:hover:border-cyber-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 dark:text-amber-300" />
            {simulatedPath ? 'Hide Causal Trace' : 'Simulate Root-Cause Trace'}
          </motion.button>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono border-l border-slate-200 dark:border-obsidian-800 pl-3.5">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              REPAID
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              ACTIVE DEBT
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              SUSPECTED
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-obsidian-700"></span>
              CLEAR
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar: Domain Categories + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs max-w-full custom-scrollbar">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono font-semibold text-[11px] shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-400" /> Domain:
          </span>
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all text-xs font-mono font-medium cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950 font-bold'
                  : 'bg-slate-100 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-obsidian-850 border border-slate-200 dark:border-obsidian-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-500"
          />
        </div>
      </div>

      {/* Active Causal Path Alert Banner */}
      {simulatedPath && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-gradient-to-r dark:from-obsidian-950 dark:via-cyber-950/40 dark:to-obsidian-950 border border-blue-300 dark:border-cyber-500/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-blue-800 dark:text-cyber-200"
        >
          <div className="flex items-center gap-2.5 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyber-400 shrink-0 animate-spin" />
            <span className="text-slate-900 dark:text-white font-bold font-display">Diagnosed Root-Cause Causal Path:</span>
            <span className="font-mono text-blue-700 dark:text-cyan-300 font-bold bg-white dark:bg-obsidian-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-cyber-500/40">
              {simulatedPath.join(' → ')}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950 px-2.5 py-0.5 rounded-full shadow-sm">
            Recursive Multi-Hop Active
          </span>
        </motion.div>
      )}

      {/* DAG Node Grid */}
      <div className="bg-slate-50 dark:bg-obsidian-950/80 p-4 rounded-2xl border border-slate-200 dark:border-obsidian-800 overflow-x-auto custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 min-w-[700px]">
          {filteredNodes.map((node) => {
            const isRepaid = node.status === 'REPAID';
            const isActiveDebt = ['CONFIRMED_DEBT', 'IN_INTERVENTION', 'VERIFYING', 'FAILED'].includes(node.status);
            const isSuspected = node.status === 'SUSPECTED';
            const inCausalPath = isNodeInCausalPath(node.name);
            const isSelected = selectedConcept?.id === node.id;
            const evidenceCount = (node.evidence_trail || []).length;

            return (
              <motion.div
                key={node.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedConcept(node)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative text-left select-none ${
                  inCausalPath 
                    ? 'ring-2 ring-blue-500 dark:ring-cyber-400 border-blue-400 dark:border-cyber-400 bg-blue-50 dark:bg-cyber-950/40 text-blue-900 dark:text-cyan-100 scale-102' 
                    : isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-obsidian-900 shadow-lg'
                    : isRepaid
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-slate-800 dark:text-white hover:border-emerald-400'
                    : isActiveDebt
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/70 text-slate-800 dark:text-white hover:border-rose-400'
                    : isSuspected
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 text-slate-800 dark:text-white hover:border-amber-400'
                    : 'bg-white dark:bg-obsidian-900/60 border-slate-200 dark:border-obsidian-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-obsidian-700'
                }`}
              >
                {inCausalPath && (
                  <span className="absolute -top-2 -right-1 bg-blue-600 dark:bg-cyber-400 text-white dark:text-obsidian-950 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight shadow-sm">
                    ROOT CAUSE
                  </span>
                )}

                <div className="text-[9px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 truncate mb-1">
                  {node.category}
                </div>

                <div className="text-xs font-bold font-display leading-snug line-clamp-2">
                  {node.name}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isRepaid
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                      : isActiveDebt
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/60 animate-pulse'
                      : isSuspected
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                      : 'bg-slate-100 dark:bg-obsidian-850 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-obsidian-750'
                  }`}>
                    {node.status}
                  </span>

                  {evidenceCount > 0 ? (
                    <span className="text-[10px] font-mono text-blue-600 dark:text-cyber-400 font-bold flex items-center gap-0.5" title={`${evidenceCount} evidence records`}>
                      <Activity className="w-3 h-3" />
                      {evidenceCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      #{node.id}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Deep-Dive Drawer with Prerequisites, Dependents & Evidence Trail */}
      <AnimatePresence>
        {selectedConcept && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-5 rounded-2xl bg-white dark:bg-obsidian-950 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-obsidian-800 space-y-4 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyber-500/10 border border-blue-200 dark:border-cyber-500/30 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-display">
                    {selectedConcept.name}
                    <span className="text-[10px] font-mono text-blue-600 dark:text-cyber-400 font-normal">({selectedConcept.code})</span>
                  </h4>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Domain: <strong className="text-slate-700 dark:text-slate-300">{selectedConcept.category}</strong></span>
                    <span>•</span>
                    <span>Difficulty: <strong className="text-slate-700 dark:text-slate-300">{selectedConcept.difficulty}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-amber-600 dark:text-amber-400">{selectedConcept.status}</strong></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConcept(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-850 text-xs font-mono font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-obsidian-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-obsidian-800">
              {selectedConcept.description || 'Foundational conceptual unit within the Data Structures and Algorithms prerequisite graph.'}
            </p>

            {/* Graph Connections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prerequisites */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-cyber-400" />
                  Upstream Prerequisites (Must Master First):
                </span>
                {getPrerequisitesForNode(selectedConcept.id).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {getPrerequisitesForNode(selectedConcept.id).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedConcept(p)}
                        className="bg-white dark:bg-obsidian-950 text-blue-600 dark:text-cyber-300 hover:text-blue-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-obsidian-850 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-slate-200 dark:border-obsidian-750 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        ← {p.name}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono">
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px] font-mono">None (Root Foundational Axiom)</span>
                )}
              </div>

              {/* Downstream Dependents */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Downstream Dependents (Compounding Debt Risk):
                </span>
                {getDependentsForNode(selectedConcept.id).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {getDependentsForNode(selectedConcept.id).map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedConcept(d)}
                        className="bg-white dark:bg-obsidian-950 text-amber-600 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white hover:bg-amber-50 dark:hover:bg-obsidian-850 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-slate-200 dark:border-obsidian-750 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        → {d.name}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono">
                          {d.status}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px] font-mono">Terminal Application Node</span>
                )}
              </div>
            </div>

            {/* Student Empirical Evidence Trail Table */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-400" />
                  Student Empirical Evidence Trail:
                </span>
                <span className="text-slate-400 font-normal">
                  {(selectedConcept.evidence_trail || []).length} Recorded Attempts
                </span>
              </div>

              {(selectedConcept.evidence_trail || []).length > 0 ? (
                <div className="overflow-x-auto text-[11px] custom-scrollbar">
                  <table className="w-full text-left border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-obsidian-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase">
                        <th className="py-2">Attempt / Source</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-obsidian-850 text-slate-600 dark:text-slate-300">
                      {selectedConcept.evidence_trail.map((ev, idx) => (
                        <tr key={ev.id || idx} className="hover:bg-slate-100 dark:hover:bg-obsidian-850/60">
                          <td className="py-2 uppercase font-bold text-slate-800 dark:text-white font-sans">
                            {ev.source}
                          </td>
                          <td className="py-2 font-bold">
                            <span className={ev.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {ev.score}%
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              ev.passed 
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {ev.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="py-2 text-slate-400 dark:text-slate-500 text-[10px]">
                            {ev.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px] py-1 font-mono">
                  No empirical assessment attempts recorded yet for Student ID #{studentId} on this concept.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

