import React, { useState } from 'react';
import { Search, Wrench, User, Target, Check, RotateCcw, HelpCircle } from 'lucide-react';
import { getTrailStepIndex, stateLabel, stateDescription } from './ui/stateMapper';

const TRAIL_STOPS = [
  { id: 1, key: 'spotted', title: 'Spotted', iconName: 'search', desc: 'We noticed you keep missing questions in this concept. That is how a gap is found.', icon: Search },
  { id: 2, key: 'fix_it', title: 'Fix it', iconName: 'wrench', desc: 'The AI tutor prepares a way to learn the topic, like a diagram or a step-by-step trace.', icon: Wrench },
  { id: 3, key: 'mentor_ok', title: 'Mentor OK', iconName: 'user', desc: 'A real mentor approves the plan first, so you never get a bad suggestion.', icon: User },
  { id: 4, key: 'prove_it', title: 'Prove it', iconName: 'target', desc: 'Answer a short check-up quiz. Score 80% or more to clear the topic.', icon: Target },
  { id: 5, key: 'cleared', title: 'Cleared', iconName: 'check', desc: 'Topic closed! Your knowledge debt score drops and the topic turns green.', icon: Check },
];

export default function DebtTrail({ currentState = 'CONFIRMED_DEBT', conceptName = 'Linked Lists', compact = false, className = '' }) {
  const currentStep = getTrailStepIndex(currentState); // 1 to 5
  const [selectedIdx, setSelectedIdx] = useState(Math.min(currentStep - 1, 4));

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {TRAIL_STOPS.map((stop, i) => {
          const isDone = i < currentStep || currentStep === 5;
          const isNow = i === currentStep - 1 && currentStep < 5;

          let circleBg = 'bg-slate-200 dark:bg-slate-700 text-[#5A6190]';
          if (isDone) circleBg = 'bg-[#D1FADF] border border-[#12B76A] text-[#05603A]';
          if (isNow) circleBg = 'bg-[#5B4BFF] text-white ring-2 ring-[#5B4BFF]/30 animate-pulse';

          return (
            <div key={stop.id} className="flex items-center gap-1" title={`${stop.title}: ${stop.desc}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${circleBg}`}>
                {stop.id}
              </div>
              {i < 4 && <div className={`w-2 h-0.5 ${i < currentStep - 1 ? 'bg-[#12B76A]' : 'bg-[#DCE1F5] dark:bg-slate-700'}`} />}
            </div>
          );
        })}
      </div>
    );
  }

  const activeStop = TRAIL_STOPS[selectedIdx] || TRAIL_STOPS[0];

  return (
    <section className={`bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE1F5] dark:border-white/10 pb-3">
        <h2 className="text-xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
          Your {conceptName} trail
        </h2>
        <span className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8]">
          Tap a stop to see what it means
        </span>
      </div>

      {/* Track & Loop */}
      <div className="relative pt-[48px] pb-2">
        {/* Loop Back Banner */}
        <div className="absolute left-[28%] width-[44%] w-[44%] top-1.5 h-8 border-2 border-dashed border-[#F04438] border-b-0 rounded-t-2xl pointer-events-none hidden sm:block">
          <span className="absolute left-1/2 -top-3.5 -translate-x-1/2 bg-[#FEE4E2] text-[#B42318] text-[11px] font-extrabold px-3 py-0.5 rounded-full whitespace-nowrap shadow-xs">
            Not passed? The AI teaches it a new way
          </span>
        </div>

        {/* 5 Stations Grid */}
        <div className="grid grid-cols-5 gap-1 relative z-10">
          {TRAIL_STOPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < currentStep || currentStep === 5;
            const isNow = i === currentStep - 1 && currentStep < 5;
            const isSelected = selectedIdx === i;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedIdx(i)}
                className={`relative text-center px-1 group cursor-pointer focus:outline-none`}
              >
                {/* Connecting Line Left & Right */}
                <div className={`absolute top-6 left-0 right-1/2 h-1 transition-colors duration-500 -z-10 ${i === 0 ? 'hidden' : i <= currentStep - 1 ? 'bg-[#12B76A]' : 'bg-[#DCE1F5] dark:bg-slate-700'}`} />
                <div className={`absolute top-6 left-1/2 right-0 h-1 transition-colors duration-500 -z-10 ${i === 4 ? 'hidden' : i < currentStep - 1 ? 'bg-[#12B76A]' : 'bg-[#DCE1F5] dark:bg-slate-700'}`} />

                {/* Dot */}
                <div
                  className={`w-[52px] h-[52px] rounded-full mx-auto mb-2 flex items-center justify-center border-[3px] transition-all duration-300 ${
                    isDone
                      ? 'bg-[#D1FADF] border-[#12B76A] text-[#05603A]'
                      : isNow
                      ? 'bg-[#5B4BFF] border-[#C9C3FF] text-white shadow-[0_0_0_8px_rgba(91,75,255,0.2)] animate-pulse'
                      : 'bg-[#EEF0FC] dark:bg-[#22295E] border-[#CFD5F2] dark:border-slate-700 text-[#5A6190] dark:text-[#94A3B8]'
                  } ${isSelected ? 'ring-4 ring-[#5B4BFF]/30 scale-105' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <b className="block text-xs sm:text-sm font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                  {s.title}
                </b>

                {isNow && (
                  <span className="inline-block mt-1 bg-[#5B4BFF] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    You are here
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Speech Callout Box */}
      <div className="mt-4 p-4 rounded-xl bg-[#EDEAFF] dark:bg-[#5B4BFF]/20 border-l-4 border-[#5B4BFF] font-semibold text-xs sm:text-sm text-[#1B2150] dark:text-[#F1F5F9] leading-relaxed min-h-[58px] flex items-center">
        <span>
          <strong className="text-[#5B4BFF] dark:text-[#818CF8] font-bold mr-1.5">
            Stop {activeStop.id} ({activeStop.title}):
          </strong>
          {activeStop.desc}
        </span>
      </div>
    </section>
  );
}

