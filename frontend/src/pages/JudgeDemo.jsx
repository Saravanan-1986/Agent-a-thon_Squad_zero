import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AppLayout from '../components/AppLayout';
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
  Lock,
  UserCheck,
  Volume2
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
      subtitle: "Rahul Sharma: Is a low quiz score random noise or real topic debt?",
      tagline: "Rule: A single mistake never creates debt. It requires a confirmed pattern.",
      pitchScript: "Look at student Rahul. He got an Array question right (95%), but failed Pointers three times. A standard quiz tool gives him another question. We detect real debt. Meanwhile, a single slip in Linked Lists is only flagged Spotted."
    },
    {
      num: 2,
      title: "Scene 2: Prerequisite Topic Diagnosis",
      subtitle: "Rahul fails Linked Lists. We trace the prerequisite chain to find the real root cause.",
      tagline: "Root-Cause Isolated: Pointer Dereferencing",
      pitchScript: "Now Rahul fails Linked Lists. A naive tool would give him more Linked List videos. But our system traces prerequisites backwards and pinpoints the true cause: Pointer Dereferencing!"
    },
    {
      num: 3,
      title: "Scene 3: AI Proposes, Mentor Approves",
      subtitle: "AI drafts lesson plan V1. Human mentor in the loop reviews before student receives it.",
      tagline: "Teacher Guidance: No unreviewed AI advice reaches the student.",
      pitchScript: "The AI generates a custom lesson, but here is our rule: No unreviewed AI advice ever reaches a student. A teacher mentor must review and approve it first."
    },
    {
      num: 4,
      title: "Scene 4: AI Adapts Lesson (V1 -> V2)",
      subtitle: "Lesson V1 fails check-up quiz. System adapts to teach using visual memory tools.",
      tagline: "Adaptive Remediation: Dynamic pivot to visual RAM simulation.",
      pitchScript: "Rahul takes the test and scores under 80%. The AI detects the failure and dynamically pivots to an Interactive RAM Simulation where Rahul visualizes memory pointers!"
    },
    {
      num: 5,
      title: "Scene 5: Empirical Proof (Mastery Verified)",
      subtitle: "Fresh check-up question -> Score 88% PASS -> Status becomes Cleared.",
      tagline: "Core Rule: 'The AI didn't decide the student learned. The evidence did.'",
      pitchScript: "Rahul gets a fresh check-up challenge and scores 88%. The topic transitions to Cleared. And can a student fake mastery? Click this test button—the backend immediately throws an error: Evidence decides!"
    }
  ];

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#12B76A', '#FF6A2B', '#5B4BFF']
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
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        
        {/* Banner */}
        <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#FF6A2B] to-[#FF8048] text-white shadow-soft-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guided Judge Demo Banner</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-300/50 text-amber-100 text-xs font-bold tracking-tight">
                  <Lock className="w-3 h-3" />
                  <span>SCRIPTED WALKTHROUGH, not live</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Knowledge Debt Engine — Guided Walkthrough
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
                Follow Rahul's learning journey across 5 interactive scenes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset} icon={RotateCcw}>
                Reset Demo State
              </Button>
              <Button variant="primary" size="md" onClick={handleNextScene} icon={ArrowRight} iconPosition="right">
                {currentScene === 5 ? 'Restart Scene 1' : `Next: Scene ${currentScene + 1} →`}
              </Button>
            </div>
          </div>

          {/* 5-Step Scene Nav Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/20">
            {SCENES.map((scene) => (
              <button
                key={scene.num}
                onClick={() => loadScene(scene.num)}
                className={`p-3 rounded-xl text-left transition-all text-xs font-bold cursor-pointer ${
                  currentScene === scene.num
                    ? 'bg-white text-[#1B2150] shadow-soft'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="text-[10px] uppercase font-bold opacity-75">Scene {scene.num}</div>
                <div className="truncate mt-0.5">{scene.title.split(':')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Presenter Pitch Script */}
        <div className="p-4 rounded-[20px] bg-[#FEF6E7] dark:bg-[#F79009]/20 border border-[#FDECAB] dark:border-[#F79009]/30 text-xs text-[#1B2150] dark:text-[#F1F5F9] space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2 text-[#B54708] dark:text-[#FBBF24]">
              <Volume2 className="w-4 h-4" />
              Presenter Pitch Cue (Scene {currentScene}):
            </span>
          </div>
          <p className="text-xs italic font-medium leading-relaxed">
            "{currentMeta.pitchScript}"
          </p>
        </div>

        {/* Active Scene Title */}
        <div className="p-5 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-1">
          <span className="text-xs font-bold text-[#FF6A2B] uppercase tracking-wider block">
            {currentMeta.tagline}
          </span>
          <h2 className="text-xl font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            {currentMeta.title}
          </h2>
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* SCENE 1 */}
        {currentScene === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-[20px] bg-[#E8FDF2] dark:bg-[#12B76A]/20 border border-[#A6F4C5] space-y-2">
              <span className="text-xs font-bold text-[#027A48]">Array Traversal</span>
              <p className="text-xs text-[#027A48] font-medium">Verified passing score (95%). Status: Cleared.</p>
            </div>
            <div className="p-5 rounded-[20px] bg-[#FEE4E2] dark:bg-[#F04438]/20 border border-[#FECDCA] space-y-2">
              <span className="text-xs font-bold text-[#B42318]">Pointer Dereferencing</span>
              <p className="text-xs text-[#B42318] font-medium">3 wrong answers. Status: Fix needed (High Priority).</p>
            </div>
          </div>
        )}

        {/* SCENE 2 */}
        {currentScene === 2 && (
          <DebtGraph studentId={1} activeCausalPath={['Linked List Traversal', 'Pointer Dereferencing', 'Memory Model & Stack/Heap']} />
        )}

        {/* SCENE 3 */}
        {currentScene === 3 && (
          <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#5B4BFF]" />
                Mentor Review Desk
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8FDF2] text-[#027A48]">
                Mentor Approved
              </span>
            </div>
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
              Dr. Elena Vance reviewed and approved the AI lesson plan for Pointer Dereferencing before sending it to Rahul.
            </p>
          </div>
        )}

        {/* SCENE 4 */}
        {currentScene === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-[20px] bg-[#FEF6E7] dark:bg-[#F79009]/20 border border-[#FDECAB] text-xs font-bold text-[#B54708]">
              Lesson V1 quiz score was 45% (&lt;80%). AI automatically adapted to Strategy V2 (Interactive Hardware RAM Simulator)!
            </div>
            <MemorySimulator />
          </div>
        )}

        {/* SCENE 5 */}
        {currentScene === 5 && (
          <div className="space-y-6">
            <div className="p-8 rounded-[20px] bg-[#E8FDF2] dark:bg-[#12B76A]/20 border border-[#A6F4C5] text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#12B76A] mx-auto" />
              <h3 className="text-2xl font-extrabold text-[#027A48]">
                Topic Status: Cleared!
              </h3>
              <p className="text-xs text-[#027A48] font-medium">
                Rahul scored 88% on the fresh check-up quiz (Pass mark: 80%). Knowledge debt successfully repaid.
              </p>
            </div>

            {/* Anti-tamper demo button */}
            <div className="p-5 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-3">
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] block">
                Security Barrier Demo:
              </span>
              <Button variant="danger" size="sm" onClick={handleTriggerAdversarial} disabled={adversarialLoading}>
                {adversarialLoading ? 'Testing Barrier...' : 'Test Forgery Prevention (Self-Report REPAID)'}
              </Button>

              {adversarialResult && (
                <div className="p-3 rounded-xl bg-[#FEE4E2] text-[#B42318] text-xs font-bold">
                  ✓ Rejected by system: {adversarialResult.error_message || 'Evidence required. Self-reporting is strictly disabled.'}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
