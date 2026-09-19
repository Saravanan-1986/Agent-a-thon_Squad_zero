import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Metric from '../components/ui/Metric';
import StatusBadge from '../components/ui/StatusBadge';
import { getStudentDebts } from '../services/api';
import { TrendingUp, CheckCircle2, BookOpen, Award, Target, Zap, ArrowUpRight } from 'lucide-react';

export default function ProgressPage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDebts(selectedStudentId || '1')
      .then(d => setDebts(d || []))
      .finally(() => setLoading(false));
  }, [selectedStudentId]);

  const repaidCount = debts.filter(d => d.status === 'REPAID').length;
  const activeCount = debts.filter(d => d.status === 'CONFIRMED_DEBT').length;
  const totalDebts = debts.length;
  const recoveryRate = totalDebts > 0 ? Math.round((repaidCount / totalDebts) * 100) : 100;

  const concepts = [
    { name: 'Memory Architecture & Stack/Heap', code: 'DSA-MEM-MODEL', mastery: 100, status: 'REPAID' },
    { name: 'Pointers & Memory References', code: 'DSA-PTR-BASICS', mastery: 95, status: 'REPAID' },
    { name: 'Pointer Dereferencing & Null Safety', code: 'DSA-PTR-DEREF', mastery: 90, status: 'REPAID' },
    { name: 'Singly Linked List Traversal', code: 'DSA-LL-TRAVERSAL', mastery: 85, status: 'SUSPECTED' },
    { name: 'Linked List Node Insertion', code: 'DSA-LL-INSERTION', mastery: 70, status: 'VERIFYING' },
    { name: 'Binary Tree Traversal (DFS/BFS)', code: 'DSA-TREE-TRAVERSAL', mastery: 65, status: 'CLEAR' },
    { name: 'Binary Search Tree Balancing', code: 'DSA-BST-BALANCING', mastery: 40, status: 'CONFIRMED_DEBT' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          category="Mastery Analytics"
          title="Prerequisite Mastery & Debt Amortization"
          subtitle="Real-time empirical tracking of concept mastery and knowledge debt repayment trajectory across the DSA curriculum."
        />

        {/* Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-obsidian-850/80 border border-slate-200 dark:border-slate-700/60 relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Tracked Debts</p>
                <h4 className="text-2xl font-black font-display text-slate-900 dark:text-white mt-0.5">{totalDebts} Concepts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Identified via diagnostics</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Target className="w-4 h-4" />
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
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Amortization Rate</p>
                <h4 className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5">{recoveryRate}%</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{repaidCount} repaid debts</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4" />
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
                <p className="text-[10px] font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400">Active In-Flight Deficits</p>
                <h4 className="text-2xl font-black font-display text-rose-600 dark:text-rose-400 mt-0.5">{activeCount}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Under V1/V2 remediation</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Zap className="w-4 h-4" />
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
                <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-cyber-400">Avg Adaptation Velocity</p>
                <h4 className="text-2xl font-black font-display text-blue-600 dark:text-cyber-400 mt-0.5">1.4 Cyc</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Cycles to empirical pass</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-cyber-500/10 border border-blue-200 dark:border-cyber-500/30 flex items-center justify-center text-blue-600 dark:text-cyber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Concept Mastery Bars */}
          <Panel 
            title="Prerequisite Concept Mastery Spectrum" 
            subtitle="Calculated from empirical assessment checkpoints and verification responses"
            className="lg:col-span-2 space-y-4"
          >
            <div className="space-y-4 pt-2">
              {concepts.map((c, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-obsidian-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {c.code}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className={`font-mono font-bold text-xs ${
                        c.mastery >= 85 ? 'text-emerald-600 dark:text-emerald-400' : c.mastery >= 60 ? 'text-blue-600 dark:text-cyber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {c.mastery}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-obsidian-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${c.mastery}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-full rounded-full ${
                        c.mastery >= 85 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                          : c.mastery >= 60 
                          ? 'bg-gradient-to-r from-blue-500 dark:from-cyber-500 to-indigo-500' 
                          : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Panel>

          {/* Repayment Stats */}
          <Panel 
            title="Debt Amortization Analysis" 
            subtitle="Lifecycle resolution benchmarks"
            className="space-y-4"
          >
            <div className="space-y-4 pt-2">
              <Metric
                label="Total Debts Repaid"
                value={`${repaidCount} Concepts`}
                subtext="Empirically verified via fresh coding challenges"
                icon={CheckCircle2}
                statusColor="emerald"
              />

              <Metric
                label="Strategy Adaptation Rate"
                value="94.2% Success"
                subtext="V1 abstract → V2 visual RAM simulation lift"
                icon={BookOpen}
                statusColor="cyber"
              />

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>DAG Prerequisite Depth</span>
                  <span className="text-blue-600 dark:text-cyber-400 font-bold">4 Hops</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>Adversarial Integrity</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Strict 0-Tolerance</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>Faculty Authority</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Human-in-Loop</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
