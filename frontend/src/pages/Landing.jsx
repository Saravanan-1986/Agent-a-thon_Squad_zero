import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ui/ThemeToggle';
import Button from '../components/ui/Button';
import { BrainCircuit, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shadow-2xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Knowledge Debt Engine
            </span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 ml-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              Academic Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} icon={LogIn}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')} icon={UserPlus}>
            Create Student Account
          </Button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-10 my-auto">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Academic Intelligence + Human Mentorship + Evidence-Based Remediation
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Learning gaps become <br />
            <span className="text-blue-600 dark:text-blue-400">Knowledge Debt.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Detect what students haven't mastered. Understand why. Intervene intelligently. Verify learning before closing the gap.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Get Started
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* 5-Step How It Works Section */}
        <div className="pt-8 space-y-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Knowledge Debt Lifecycle
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-left">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">01 Detect</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Identify Gaps</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Log persistent quiz & assessment weakness patterns.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">02 Measure</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Quantify Debt</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Calculate Debt Score based on persistence & prerequisites.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">03 Intervene</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Strategy</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Deliver targeted remediation approved by human mentors.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">04 Verify</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Quiz Challenge</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Require empirical evidence quiz pass to verify understanding.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">05 Repay</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Resolve Debt</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Transition concept state to verified REPAID.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-5 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Knowledge Debt Engine • Academic Intelligence Platform
      </footer>
    </div>
  );
}
