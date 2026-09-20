import React from 'react';
import { Sparkles, ShieldCheck, Clock, History, Cpu, Lightbulb, CheckCircle2 } from 'lucide-react';
import MarkdownRenderer from './ui/MarkdownRenderer';
import MemorySimulator from './MemorySimulator';

export default function InterventionCard({ intervention }) {
  if (!intervention) return null;

  const isV2 = (intervention.version || 1) > 1;

  return (
    <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
      
      {/* Header: Strategy Version & Mentor Status Chip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-soft ${
            isV2 ? 'bg-[#5B4BFF]' : 'bg-[#FF6A2B]'
          }`}>
            Strategy V{intervention.version || 1} {isV2 ? '(V2 Visual Branch)' : '(V1 Initial Plan)'}
          </span>
          <h4 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            {intervention.strategy || 'Tailored AI Lesson Plan'}
          </h4>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8FDF2] text-[#027A48] dark:bg-[#12B76A]/20 dark:text-[#34D399] border border-[#A6F4C5] dark:border-[#12B76A]/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {intervention.mentor_status || 'Mentor Approved'}
        </span>
      </div>

      {/* V1 -> V2 Adaptation Reason */}
      {isV2 && (
        <div className="p-4 rounded-xl bg-[#EEECFF] text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#818CF8] border border-[#C7D2FE] dark:border-[#5B4BFF]/30 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <Lightbulb className="w-4 h-4" />
            <span>Why this strategy adapted (V1 &rarr; V2):</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {intervention.version_note || 'Verification score under 80% triggered V2 visual simulation to teach the concept using interactive hardware RAM memory registers.'}
          </p>
        </div>
      )}

      {/* Formatted Markdown Lesson Content */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10">
        {typeof intervention.content === 'object' && intervention.content !== null ? (
          <div className="space-y-3">
            {intervention.content.concept_explanation && (
              <MarkdownRenderer content={typeof intervention.content.concept_explanation === 'string' ? intervention.content.concept_explanation : JSON.stringify(intervention.content.concept_explanation)} />
            )}
            {intervention.content.debugging_walkthrough && (
              <MarkdownRenderer content={typeof intervention.content.debugging_walkthrough === 'string' ? intervention.content.debugging_walkthrough : JSON.stringify(intervention.content.debugging_walkthrough)} />
            )}
          </div>
        ) : (
          <MarkdownRenderer content={intervention.content || 'No lesson text provided.'} />
        )}
      </div>

      {/* Interactive RAM Memory Model for V2 Strategy */}
      {isV2 && (
        <div className="pt-2">
          <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8] block mb-2">
            Interactive Hardware Memory Simulator (V2 Tool):
          </span>
          <MemorySimulator />
        </div>
      )}

    </div>
  );
}
