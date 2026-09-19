import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ui/ThemeToggle';
import Button from '../components/ui/Button';
import { 
  BrainCircuit, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Network, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Flame
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeConcept, setActiveConcept] = useState('DSA-PTR-DEREF');

  // Mini-DAG Interactive generative teaser nodes
  const teaserNodes = [
    { id: 'DSA-MEM-MODEL', name: 'Stack / Heap Memory', status: 'REPAID', color: 'emerald', desc: 'Prerequisite mastered.' },
    { id: 'DSA-PTR-BASICS', name: 'Pointers & References', status: 'REPAID', color: 'emerald', desc: 'Address-of and reference syntax clear.' },
    { id: 'DSA-PTR-DEREF', name: 'Pointer Dereferencing', status: 'CONFIRMED_DEBT', color: 'rose', desc: 'ROOT CAUSE: Null ptr dereference triggers recurring SIGSEGV.' },
    { id: 'DSA-LL-TRAVERSAL', name: 'Linked List Traversal', status: 'SUSPECTED', color: 'amber', desc: 'Symptomatic failure triggered by upstream pointer dereference debt.' },
  ];

  return (
    <div className="min-h-screen bg-obsidian-980 text-white flex flex-col justify-between selection:bg-cyber-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-obsidian-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-indigo-600 p-0.5 shadow-glow">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-cyber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Knowledge Debt Engine
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-cyber-500/10 border border-cyber-500/30 text-cyber-400">
                v2.0 LIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/demo')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 border border-amber-400/40 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Judge Pitch Demo</span>
          </motion.button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} icon={LogIn}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')} icon={UserPlus}>
            Register
          </Button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-14 text-center space-y-12 my-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-obsidian-900/90 border border-cyber-500/30 text-cyber-300 text-xs font-mono shadow-inner"
          >
            <span className="w-2 h-2 rounded-full bg-cyber-400 animate-ping" />
            <span>Google Gemini + OpenRouter Multi-Model Agent Architecture</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.15]"
          >
            Stop Teaching to Mistakes.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 via-indigo-300 to-cyber-200">
              Diagnose the Root-Cause Knowledge Debt.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            A multi-hop causal inference engine for Data Structures & Algorithms. When a student fails Linked Lists, we isolate the missing Pointer Dereferencing invariant and remediate it before learning collapses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              variant="glow"
              size="lg"
              onClick={() => navigate('/demo')}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-none font-bold text-sm tracking-wide shadow-xl shadow-orange-500/25"
              icon={Sparkles}
            >
              Start 5-Scene Judge Demo (Rahul's Story)
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              icon={ArrowRight}
              iconPosition="right"
              className="text-sm font-semibold"
            >
              Open Academic Dashboard
            </Button>
          </motion.div>
        </div>

        {/* Generative UI Concept DAG Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-3xl border border-obsidian-750 text-left max-w-4xl mx-auto shadow-2xl relative"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-obsidian-800 gap-2">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyber-400">
                Interactive Generative Causal Teaser
              </div>
              <h3 className="text-base font-bold text-white font-display">
                Recursive Prerequisite DAG Traversal
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Causal Root Identified: DSA-PTR-DEREF</span>
            </div>
          </div>

          {/* Interactive DAG Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-2">
            {teaserNodes.map((node, i) => {
              const isSelected = activeConcept === node.id;
              const isRose = node.color === 'rose';
              const isAmber = node.color === 'amber';
              const isEmerald = node.color === 'emerald';

              return (
                <div
                  key={node.id}
                  onClick={() => setActiveConcept(node.id)}
                  className={`
                    p-3.5 rounded-2xl cursor-pointer transition-all border relative overflow-hidden
                    ${isSelected 
                      ? isRose ? 'bg-rose-950/40 border-rose-500 shadow-glow-rose' 
                        : isAmber ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/20' 
                        : 'bg-emerald-950/40 border-emerald-500 shadow-glow-emerald'
                      : 'bg-obsidian-900/60 border-obsidian-800 hover:border-obsidian-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400">Hop {i + 1}</span>
                    <span className={`
                      text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase
                      ${isRose ? 'bg-rose-500/20 text-rose-300' : isAmber ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}
                    `}>
                      {node.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white mb-1 font-display">{node.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">{node.id}</div>
                </div>
              );
            })}
          </div>

          {/* Detail card of currently selected node */}
          {activeConcept && (
            <motion.div
              key={activeConcept}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-obsidian-900/90 border border-obsidian-800 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {teaserNodes.find(n => n.id === activeConcept)?.name} ({activeConcept})
                  </div>
                  <div className="text-xs text-slate-300">
                    {teaserNodes.find(n => n.id === activeConcept)?.desc}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/demo')}
                className="px-3 py-1.5 rounded-lg bg-cyber-500/20 text-cyber-300 hover:bg-cyber-500/30 border border-cyber-500/40 text-xs font-mono font-semibold cursor-pointer shrink-0"
              >
                Inspect in Live Demo →
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* 3-Card Glass Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-6">
          <div className="glass-card p-6 rounded-2xl border border-obsidian-800 space-y-3 relative overflow-hidden group hover:border-cyber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyber-500/10 border border-cyber-500/30 flex items-center justify-center text-cyber-400 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Multi-Hop Prerequisite DAG</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps 46 foundational DSA concepts across 5 categories. Traverses recursive upstream dependencies to locate root knowledge gaps rather than patching downstream symptoms.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-obsidian-800 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Multi-Model Agent Intelligence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dual-mode engine with native Google Gemini REST integration and OpenRouter fallback. Features strategy evolution from theoretical V1 to interactive RAM simulation V2.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-obsidian-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Zero-Trust Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              LLMs propose remediation; a deterministic state machine validates learning. Defeats adversarial guesses and hallucinated answers with rigorous rubric checks.
            </p>
          </div>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="p-4 rounded-2xl bg-obsidian-900/60 border border-obsidian-800 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyber-400" />
            <span>46 DSA Canonical Concepts</span>
          </div>
          <span className="text-obsidian-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>5-Scene Guided Presentation</span>
          </div>
          <span className="text-obsidian-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Mock Loop Guarantee</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs font-mono text-slate-500 border-t border-obsidian-800/80">
        Knowledge Debt Engine • Advanced Agentic AI • Pitch Demonstration Edition
      </footer>
    </div>
  );
}

