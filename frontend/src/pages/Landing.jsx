import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { 
  BrainCircuit, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  Wrench, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  X,
  HelpCircle
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <div className="min-h-screen text-[#1B2150] dark:text-[#F1F5F9] flex flex-col justify-between selection:bg-[#FF6A2B] selection:text-white relative">
      
      {/* Top Header */}
      <header className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A2B] to-[#5B4BFF] flex items-center justify-center text-white shadow-glow-orange">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-[#1B2150] dark:text-[#F1F5F9]">
              Knowledge Debt Engine
            </h1>
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
              Personalized learning gap recovery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/register')}
          >
            Get started
          </Button>
        </div>
      </header>      {/* Main Hero Content */}
      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-12 text-center space-y-10 my-auto">
        <div className="p-8 sm:p-12 rounded-[24px] text-white bg-gradient-to-br from-[#2F2A8C] via-[#5B4BFF] to-[#7A6BFF] shadow-[0_24px_48px_-28px_#2f2a8c] space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold shadow-soft">
            <Sparkles className="w-4 h-4" />
            <span>Knowledge Debt Engine &bull; AI-Powered Gap Recovery</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Find the gap. Fix the cause.<br />
            <span className="text-[#FFC53D]">
              Prove your mastery.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#E4E1FF] leading-relaxed max-w-2xl mx-auto font-medium">
            Knowledge debt is the list of topics you haven't fully understood yet. Our system pinpoints exact root causes and generates adaptive lessons so you never stay stuck.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2.5 h-[52px] px-8 rounded-full font-extrabold text-white bg-[#FF6A2B] hover:bg-[#E8591C] shadow-[0_10px_24px_-10px_#FF6A2B] hover:-translate-y-0.5 transition-all"
            >
              <span>Get started now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setExplainerOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded-full font-extrabold text-white bg-white/16 hover:bg-white/26 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How does this work?</span>
            </button>
          </div>
        </div>

        {/* 3 Visual Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#FEE4E2] text-[#B42318] dark:bg-[#F04438]/20 flex items-center justify-center shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
              1. Spot the Hidden Gap
            </h3>
            <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
              We analyze quiz errors to find the exact prerequisite concept you missed before learning breaks down.
            </p>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#E0EDFF] text-[#1849A9] dark:bg-[#2E90FA]/20 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
              2. Tailored Fix & Mentorship
            </h3>
            <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
              AI creates a customized lesson plan verified by your mentor. If needed, it adapts to teach in a new way.
            </p>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#D1FADF] text-[#05603A] dark:bg-[#12B76A]/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
              3. Prove Mastery
            </h3>
            <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
              Pass a short verification check-up (80%+ score) to confirm your gap is completely cleared.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs font-semibold text-[#8C94B2] dark:text-[#64748B]">
        Knowledge Debt Engine &bull; Educational Learning Platform
      </footer>

      {/* "See How It Works" 3-Step Visual Modal */}
      <AnimatePresence>
        {explainerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A204C] rounded-[20px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6A2B]" />
                  <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                    How Knowledge Debt Engine Works
                  </h3>
                </div>
                <button
                  onClick={() => setExplainerOpen(false)}
                  className="p-1 rounded-full text-[#8C94B2] hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium text-[#5F6788] dark:text-[#94A3B8]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#22295E]">
                  <div className="w-7 h-7 rounded-full bg-[#FF6A2B] text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <strong className="text-[#1B2150] dark:text-[#F1F5F9] font-bold block">Identify the Gap</strong>
                    Instead of just telling you an answer is wrong, the engine checks prerequisite topics to find why you made the error.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#22295E]">
                  <div className="w-7 h-7 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <strong className="text-[#1B2150] dark:text-[#F1F5F9] font-bold block">Adaptive Lesson Plan</strong>
                    The AI generates a step-by-step fix. If you struggle, it automatically adapts to teach the topic using visual memory models.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#22295E]">
                  <div className="w-7 h-7 rounded-full bg-[#12B76A] text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <strong className="text-[#1B2150] dark:text-[#F1F5F9] font-bold block">Verified Success</strong>
                    Clear your topic gap by scoring 80% or higher on the follow-up check-up quiz.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setExplainerOpen(false);
                    navigate('/login');
                  }}
                >
                  Got it, let's start!
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
