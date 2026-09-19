import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import DebtGraph from '../components/DebtGraph';
import MemorySimulator from '../components/MemorySimulator';
import { runDemoScene, runAdversarialTest, resetDemoState } from '../services/api';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  BrainCircuit,
  GitCommit,
  Cpu,
  Lock,
  UserCheck,
  Volume2,
  Clock,
  Terminal,
  ChevronRight,
  Database,
  Radio
} from 'lucide-react';

export default function JudgeDemo() {
  const [currentScene, setCurrentScene] = useState(1);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adversarialResult, setAdversarialResult] = useState(null);
  const [adversarialLoading, setAdversarialLoading] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const [showPitchNotes, setShowPitchNotes] = useState(true);

  const autoPlayTimerRef = useRef(null);

  const SCENES = [
    {
      num: 1,
      title: "Scene 1: Persistent Debt vs. Careless Slip",
      subtitle: "Student Rahul: Is a low score random noise, or confirmed conceptual debt?",
      tagline: "Rule: A single mistake never creates debt. It requires a confirmed pattern.",
      pitchScript: "Look at student Rahul. He got an Array question right (95%), but failed Pointers three times. A standard LMS gives him another MCQ. We use Scikit-Learn to detect a 76.7% knowledge gap risk and confirm real debt. Meanwhile, a single slip in Linked Lists is only flagged SUSPECTED."
    },
    {
      num: 2,
      title: "Scene 2: The 'WOW' Moment (Prerequisite DAG Diagnosis)",
      subtitle: "Rahul fails Linked Lists. Vector search blames Linked Lists; Graph traversal finds the real cause.",
      tagline: "Root-Cause Isolated: Pointer Dereferencing (Upstream Foundational Debt)",
      pitchScript: "Now Rahul fails Linked Lists. A vector database would search 'Linked Lists' and prescribe more Linked List videos. But our graph-native engine traverses prerequisites backwards and pinpoints the true root cause: Pointer Dereferencing!"
    },
    {
      num: 3,
      title: "Scene 3: AI Proposes, Human Mentor Approves",
      subtitle: "AI drafts Intervention V1. Human mentor in the loop reviews and approves before delivery.",
      tagline: "Human-in-the-Loop Safeguard: No unreviewed AI advice reaches the student.",
      pitchScript: "The AI generates an intervention, but here is our governance rule: No unreviewed AI advice ever reaches a student. A human faculty mentor must review and approve it first."
    },
    {
      num: 4,
      title: "Scene 4: AI Fails & Adapts (Agentic Strategy Pivot)",
      subtitle: "Intervention V1 fails verification (45%). System does NOT repeat the same lesson.",
      tagline: "Agentic Adaptation: Dynamic pivot from passive text to interactive RAM simulation.",
      pitchScript: "Rahul takes the test and fails with 45%. A broken AI repeats the same explanation louder. Our agent detects the failure, injects the error context into Gemini, and dynamically pivots to an Interactive Physical RAM Layout where Rahul debugs dangling pointers."
    },
    {
      num: 5,
      title: "Scene 5: Empirical Proof (Mastery Verified by Evidence)",
      subtitle: "Fresh unseen transfer question -> Score 88% PASS -> State transitions to REPAID.",
      tagline: "The Non-Negotiable Core: 'The AI didn't decide the student learned. The evidence did.'",
      pitchScript: "Rahul gets a fresh, unseen transfer challenge and scores 88%. The state machine transitions him to REPAID. And here is our closing punchline: Can a student prompt-inject or self-report mastery? Click this adversarial test button—the backend immediately throws an HTTP 400 rejection: LLM proposes, evidence decides!"
    }
  ];

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b']
      });
    } catch (e) {
      // safe fallback
    }
  };

  const loadScene = async (sceneNum) => {
    setCurrentScene(sceneNum);
    setLoading(true);
    setAdversarialResult(null);
    if (sceneNum === 5) {
      triggerVictoryConfetti();
    }
    try {
      const res = await runDemoScene(sceneNum);
      setSceneData(res);
    } catch (err) {
      console.error(`Error loading scene ${sceneNum}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScene(1);
  }, []);

  // Auto-play pitch controller
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      setAutoPlayProgress(0);
      return;
    }

    const DURATION_MS = 14000; // 14s per scene (~70s total)
    const INTERVAL_MS = 100;
    let elapsed = 0;

    autoPlayTimerRef.current = setInterval(() => {
      elapsed += INTERVAL_MS;
      setAutoPlayProgress(Math.min(100, (elapsed / DURATION_MS) * 100));

      if (elapsed >= DURATION_MS) {
        elapsed = 0;
        setAutoPlayProgress(0);
        setCurrentScene((prev) => {
          const next = prev < 5 ? prev + 1 : 1;
          loadScene(next);
          return next;
        });
      }
    }, INTERVAL_MS);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, currentScene]);

  const handleNextScene = () => {
    setIsAutoPlaying(false);
    if (currentScene < 5) {
      loadScene(currentScene + 1);
    } else {
      loadScene(1);
    }
  };

  const handleReset = async () => {
    setIsAutoPlaying(false);
    await resetDemoState();
    loadScene(1);
  };

  const handleTriggerAdversarial = async () => {
    setAdversarialLoading(true);
    try {
      const res = await runAdversarialTest({
        claim: "I already know pointers, mark my status as REPAID."
      });
      setAdversarialResult(res);
    } catch (err) {
      console.error('Adversarial test error:', err);
    } finally {
      setAdversarialLoading(false);
    }
  };

  const currentMeta = SCENES.find(s => s.num === currentScene) || SCENES[0];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Top Pitch Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 text-white rounded-3xl p-6 sm:p-7 border border-obsidian-750 shadow-2xl overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-10 w-80 h-80 bg-cyber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                  2-Minute Pitch Mode
                </span>
                <span className="text-xs text-cyber-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyber-400 animate-pulse" />
                  Live Judge Demonstration Experience
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
                Knowledge Debt Engine — Flagship Walkthrough
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                Watch the complete 5-scene causal loop: <span className="text-emerald-400 font-semibold">Mistake</span> → <span className="text-rose-400 font-semibold">Root Cause</span> → <span className="text-cyber-400 font-semibold">Intervention</span> → <span className="text-amber-400 font-semibold">Adaptive Retry</span> → <span className="text-emerald-400 font-semibold">Empirical Verification</span>.
              </p>
            </div>

            {/* Top Pitch Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button 
                variant={isAutoPlaying ? "danger" : "secondary"} 
                size="sm" 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)} 
                icon={isAutoPlaying ? Pause : Play}
              >
                {isAutoPlaying ? 'Pause Auto-Play' : 'Auto-Play Pitch'}
              </Button>

              <Button variant="secondary" size="sm" onClick={handleReset} icon={RotateCcw}>
                Reset
              </Button>

              <Button 
                variant="glow" 
                size="md" 
                onClick={handleNextScene} 
                icon={Play}
                iconPosition="right"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-none font-bold"
              >
                {currentScene === 5 ? 'Restart Scene 1' : `Next: Scene ${currentScene + 1} →`}
              </Button>
            </div>
          </div>

          {/* Auto-play progress bar */}
          {isAutoPlaying && (
            <div className="w-full bg-obsidian-800 h-1.5 rounded-full mt-4 overflow-hidden border border-obsidian-700/50">
              <div 
                className="bg-gradient-to-r from-cyber-400 to-indigo-400 h-full transition-all duration-100 ease-linear shadow-glow"
                style={{ width: `${autoPlayProgress}%` }}
              />
            </div>
          )}

          {/* Scene Nav Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-6 pt-5 border-t border-obsidian-800">
            {SCENES.map((scene) => (
              <motion.button
                key={scene.num}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setIsAutoPlaying(false); loadScene(scene.num); }}
                className={`p-3 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
                  currentScene === scene.num
                    ? 'bg-gradient-to-br from-cyber-500/20 to-indigo-600/20 border-cyber-400 text-white shadow-glow'
                    : 'bg-obsidian-900/70 border-obsidian-800 text-slate-400 hover:bg-obsidian-850 hover:text-white'
                }`}
              >
                {currentScene === scene.num && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-cyber-400/20 rounded-bl-full pointer-events-none" />
                )}
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyber-400">
                  Scene {scene.num}
                </div>
                <div className="text-xs font-bold truncate mt-1 font-display">
                  {scene.title.split(':')[1]?.trim() || scene.title}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Presenter Pitch Script / Speaking Cue Drawer */}
        <div className="bg-amber-50/90 dark:bg-obsidian-900/60 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 shadow-2xs dark:shadow-sm text-xs relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-obsidian-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 font-display">
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Presenter Speaking Cue (15-Second Pitch Script for Scene {currentScene}):</span>
            </div>
            <button 
              onClick={() => setShowPitchNotes(!showPitchNotes)}
              className="text-[11px] font-mono text-amber-800 dark:text-slate-400 hover:text-amber-950 dark:hover:text-white font-semibold cursor-pointer"
            >
              {showPitchNotes ? 'Hide Pitch Script' : 'Show Pitch Script'}
            </button>
          </div>
          <AnimatePresence>
            {showPitchNotes && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-sans italic leading-relaxed pl-3 border-l-2 border-amber-500"
              >
                "{currentMeta.pitchScript}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Active Stage Header Card */}
        <div className="bg-white dark:bg-obsidian-900/80 rounded-2xl p-5 border border-slate-200 dark:border-obsidian-800 space-y-2 shadow-2xs dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyber-500/10 dark:text-cyber-300 dark:border-cyber-500/30">
              Stage {currentScene} of 5
            </span>
            <span className="text-xs font-mono font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
              {currentMeta.tagline}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
            {currentMeta.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* SCENE CONTENT WITH ANIMATION */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* SCENE 1: RAHUL STUDENT LEDGER OVERVIEW */}
            {currentScene === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Concept 1: Arrays */}
                  <div className="p-4 rounded-2xl border bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">Concept 1</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                        ✓ REPAID
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white font-display">Array Traversal</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Verified passing evidence (Quiz: 85%, Verification: 95%). Debt fully resolved.
                    </p>
                  </div>

                  {/* Concept 2: Pointers */}
                  <div className="p-4 rounded-2xl border bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/70 space-y-2 ring-1 ring-rose-400/40 dark:ring-2 dark:ring-rose-500/30 shadow-sm dark:shadow-glow-rose">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-rose-700 dark:text-rose-400">Concept 2</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-500 animate-pulse">
                        🔴 ACTIVE DEBT
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white font-display">Pointer Dereferencing</div>
                    <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-snug">
                      Confirmed Debt (Severity: HIGH). Quiz: 42%, Coding: 0%, Retake: 45%. ML Gap Risk: 76.7%.
                    </p>
                  </div>

                  {/* Concept 3: Linked Lists */}
                  <div className="p-4 rounded-2xl border bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400">Concept 3</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                        ● SUSPECTED
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white font-display">Linked List Traversal</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      1 single failure (35%). Evidence Agent rule: Single slip never creates debt alone.
                    </p>
                  </div>

                  {/* Concept 4: Trees */}
                  <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-obsidian-900/60 border-slate-200 dark:border-obsidian-800 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Concept 4</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-obsidian-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-obsidian-700">
                        ○ CLEAR
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white font-display">Tree Traversal</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      Healthy prerequisite status. Student has not yet accumulated unresolved debt.
                    </p>
                  </div>
                </div>

                {/* Evidence Trail Table with ML Gap Risk Score */}
                <div className="bg-white dark:bg-obsidian-900/80 rounded-2xl p-5 border border-slate-200 dark:border-obsidian-800 space-y-3 shadow-2xs dark:shadow-none">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-obsidian-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
                      Rahul's Empirical Evidence Trail (Why Pointers is Confirmed Debt)
                    </h3>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-mono text-[11px] font-bold border border-rose-300 dark:border-rose-500/40">
                      Scikit-Learn ML Risk Score: 76.7% (HIGH GAP)
                    </span>
                  </div>

                  <div className="overflow-x-auto text-xs custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-obsidian-800 text-slate-500 font-mono uppercase text-[10px]">
                          <th className="py-2.5">Assessment Source</th>
                          <th className="py-2.5">Concept</th>
                          <th className="py-2.5">Score</th>
                          <th className="py-2.5">Outcome</th>
                          <th className="py-2.5">System Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-obsidian-850 font-mono text-[11px]">
                        <tr>
                          <td className="py-3 text-slate-700 dark:text-slate-300">Pointer Concept Diagnostic</td>
                          <td className="py-3 text-slate-900 dark:text-white font-sans">Pointer Dereferencing</td>
                          <td className="py-3 font-bold text-rose-600 dark:text-rose-400">42%</td>
                          <td className="py-3"><span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">FAIL</span></td>
                          <td className="py-3 font-sans text-amber-700 dark:text-amber-400">Initial Gap Signal</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-slate-700 dark:text-slate-300">Pointer Coding Sandbox</td>
                          <td className="py-3 text-slate-900 dark:text-white font-sans">Pointer Dereferencing</td>
                          <td className="py-3 font-bold text-rose-600 dark:text-rose-400">0%</td>
                          <td className="py-3"><span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">FAIL</span></td>
                          <td className="py-3 font-sans text-rose-700 dark:text-rose-400 font-bold">Persistent Gap Confirmed</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-slate-700 dark:text-slate-300">Follow-Up Memory Trace</td>
                          <td className="py-3 text-slate-900 dark:text-white font-sans">Pointer Dereferencing</td>
                          <td className="py-3 font-bold text-rose-600 dark:text-rose-400">45%</td>
                          <td className="py-3"><span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">FAIL</span></td>
                          <td className="py-3 font-sans text-rose-700 dark:text-rose-400 font-bold">ML Gap Risk 76.7% → CONFIRMED_DEBT</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 2: THE WOW MOMENT - GRAPH ROOT CAUSE */}
            {currentScene === 2 && (
              <div className="space-y-6">
                {/* Causal Comparison Box: Vector Search vs DAG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-500/40 space-y-2 text-xs shadow-2xs">
                    <div className="font-bold font-mono text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Naive Vector RAG (Broken)
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white font-display">Prescribes More Linked List Content</div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-sans">
                      Vector similarity matches "Linked List Node" text embeddings and assumes the student is struggling with Linked Lists. Prescribes 3 more Linked List videos. <em>Student fails repeatedly because the prerequisite foundation is missing!</em>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-cyber-950/30 border border-blue-300 dark:border-cyber-500/40 space-y-2 text-xs shadow-2xs dark:shadow-glow">
                    <div className="font-bold font-mono text-blue-700 dark:text-cyber-400 flex items-center gap-1.5 uppercase text-[10px]">
                      <BrainCircuit className="w-3.5 h-3.5" /> Graph-Native DAG Traversal (Engine)
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white font-display">Pinpoints Upstream Root Cause</div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-sans">
                      Recursively traverses prerequisite DAG: <strong>Linked Lists → Pointer Dereferencing → Memory Model</strong>. Finds Memory Model is mastered, but Pointer Dereferencing has unresolved debt. Isolates the true root cause with 92% confidence!
                    </p>
                  </div>
                </div>

                {/* Live Interactive DAG visualizer highlighting the causal path */}
                <DebtGraph studentId={1} activeCausalPath={['Linked List Traversal', 'Pointer Dereferencing', 'Memory Model & Stack/Heap']} />
              </div>
            )}

            {/* SCENE 3: AI PROPOSES, HUMAN MENTOR APPROVES */}
            {currentScene === 3 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-obsidian-900/80 rounded-2xl p-6 border border-slate-200 dark:border-obsidian-800 space-y-4 shadow-2xs dark:shadow-none">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-base text-slate-900 dark:text-white font-display">
                        Faculty Mentor Review Desk (Human-in-the-Loop Governance)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1.5 shadow-2xs dark:shadow-glow-emerald">
                      <CheckCircle2 className="w-3.5 h-3.5" /> MENTOR APPROVED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2 text-xs">
                      <div className="font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px]">AI-Proposed Strategy (Version 1):</div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px] space-y-1.5">
                        <div><strong className="text-slate-900 dark:text-white">Modality:</strong> Conceptual Explanation + Static Memory Diagram + Practice Exercises</div>
                        <div><strong className="text-slate-900 dark:text-white">Target:</strong> Concept #49: Pointer Dereferencing (*ptr & memory addresses)</div>
                        <div><strong className="text-slate-900 dark:text-white">Generated By:</strong> MultiModelEngine (Gemini Flash-Lite)</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Faculty Reviewer:</div>
                      <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/40 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white font-display">Dr. Elena Vance</div>
                        <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-semibold">Head of Systems & Algorithms</div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic pt-1 font-sans">
                          "Approved. The static diagram covers address-of operator. If student fails verification, escalate to interactive memory model."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Constitutional Invariant: No AI remediation can reach the student until approved by a certified educator.</span>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 4: AGENTIC ADAPTATION - FAILURE CHANGES STRATEGY */}
            {currentScene === 4 && (
              <div className="space-y-6">
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/60 rounded-2xl p-5 space-y-2 shadow-2xs dark:shadow-glow-rose">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-mono font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    The Crucial Agentic Pivot: Intervention V1 Failed Verification (Score: 45%)
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    The AI does NOT repeat the same lesson. It adapts pedagogical modality.
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    Intervention V1 (Text explanations + MCQs) was insufficient. The Orchestrator injects the failure reason into Gemini, which pivots to <strong>Intervention V2: Interactive Physical RAM Layout & Dangling Pointer Debugging</strong>!
                  </p>
                </div>

                {/* Embedded Live Interactive RAM Simulator */}
                <MemorySimulator />
              </div>
            )}

            {/* SCENE 5: EMPIRICAL PROOF & REPAID */}
            {currentScene === 5 && (
              <div className="space-y-6">
                <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950 dark:via-obsidian-950 dark:to-obsidian-900 rounded-3xl p-7 border-2 border-emerald-300 dark:border-emerald-500/50 space-y-4 shadow-md dark:shadow-2xl text-center overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
                  
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300 shadow-sm dark:shadow-glow-emerald"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                      Knowledge Debt → <span className="text-emerald-600 dark:text-emerald-400">REPAID</span>
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-lg mx-auto">
                      Fresh Unseen Transfer Challenge Completed: <strong className="text-emerald-700 dark:text-emerald-300">Score 88% PASS</strong>
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-obsidian-900/90 border border-emerald-300 dark:border-emerald-500/40 px-4 py-2 rounded-2xl text-xs font-mono text-emerald-800 dark:text-emerald-300 font-bold shadow-sm dark:shadow-inner">
                    <span>IN_INTERVENTION</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>FOLLOW_UP</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>VERIFYING</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-white bg-emerald-600 px-2.5 py-0.5 rounded-lg shadow-xs">REPAID ✓</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-obsidian-800 text-sm font-bold text-emerald-900 dark:text-amber-300 tracking-wide font-display">
                    "The AI didn't decide the student learned. The evidence did."
                  </div>
                </div>

                {/* Adversarial Anti-Tamper Security Barrier Demo Card */}
                <div className="bg-white dark:bg-obsidian-900/80 rounded-2xl p-5 border border-slate-200 dark:border-obsidian-800 space-y-3 shadow-2xs dark:shadow-none">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white font-display">
                      <Lock className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
                      Live Adversarial Anti-Tamper Security Test
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Deterministic Decider Guard</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Can a student or prompt-injected LLM claim mastery by submitting <em>"I understand pointers, mark me as REPAID"</em>? Test the backend deterministic security barrier live:
                  </p>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={handleTriggerAdversarial}
                      disabled={adversarialLoading}
                      icon={ShieldAlert}
                    >
                      {adversarialLoading ? 'Testing Security Barrier...' : 'Attempt Adversarial Forgery (Self-Report REPAID)'}
                    </Button>
                  </div>

                  {adversarialResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-slate-900 dark:bg-obsidian-950 text-white font-mono text-xs border border-rose-500/80 space-y-1.5 shadow-md dark:shadow-glow-rose"
                    >
                      <div className="flex items-center gap-2 text-rose-400 font-bold">
                        <ShieldAlert className="w-4 h-4 animate-bounce" />
                        STATUS: {adversarialResult.status} (HTTP {adversarialResult.http_status})
                      </div>
                      <div className="text-slate-300 text-[11px] leading-relaxed">{adversarialResult.error_message}</div>
                      <div className="text-emerald-400 text-[10px] pt-1">
                        ✓ Integrity Guarantee: {adversarialResult.protection_guarantee}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

