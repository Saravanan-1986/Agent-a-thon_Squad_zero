import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Clock, UserX, Lightbulb, History, ArrowRight, Terminal } from 'lucide-react';
import MemorySimulator from './MemorySimulator';

export default function InterventionCard({ intervention }) {
  if (!intervention) return null;

  const isV2 = (intervention.version || 1) > 1;

  const getMentorBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          label: 'Faculty Mentor Approved',
          icon: ShieldCheck
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          label: 'Mentor Rejected',
          icon: UserX
        };
      case 'ESCALATED':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          label: 'Human Review Escalated',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          label: 'Pending Mentor Review',
          icon: Clock
        };
    }
  };

  const mentorCfg = getMentorBadge(intervention.mentor_status);
  const MentorIcon = mentorCfg.icon;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-obsidian-850/90 border border-slate-200 dark:border-slate-700/60 space-y-4 shadow-lg relative overflow-hidden">
      {/* Background ambient corner glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
        isV2 ? 'bg-purple-500/10' : 'bg-blue-500/10'
      }`} />

      {/* AI Recommendation Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 font-semibold">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyber-400 shrink-0" />
          <span>Autonomous AI Remediation Directive (Governed by Evidence & Mentors)</span>
        </div>
        <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded text-blue-700 dark:text-blue-200 uppercase">
          Agent-Engine
        </span>
      </div>

      {/* Version Header & Adapt Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 ${
            isV2 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
              : 'bg-blue-600 text-white'
          }`}>
            <History className="w-3.5 h-3.5" />
            Strategy V{intervention.version || 1} {isV2 ? '• Tactile Evolution' : '• Initial Foundation'}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {intervention.strategy || 'AI Personalized Remediation'}
          </span>
        </div>

        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${mentorCfg.bg}`}>
          <MentorIcon className="w-3.5 h-3.5" />
          {mentorCfg.label}
        </span>
      </div>

      {/* Adaptation Reason Timeline (V1 -> V2) */}
      {isV2 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-800 dark:text-purple-200 space-y-1.5"
        >
          <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
            <Lightbulb className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
            <span>V1 → V2 Autonomous Adaptation Reason:</span>
          </div>
          <p className="text-[11px] text-purple-700/90 dark:text-purple-200/90 pl-6 leading-relaxed font-sans">
            {intervention.version_note || 'Verification evidence showed previous V1 abstract strategy did not sufficiently improve score. Engine adapted modality to visual memory hardware simulation.'}
          </p>
        </motion.div>
      )}

      {/* Content Text Container */}
      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-obsidian-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-sans">
        {typeof intervention.content === 'object' && intervention.content !== null ? (
          <div className="space-y-4">
            {intervention.content.concept_explanation && (
              <div>
                <div className="font-bold text-xs text-blue-600 dark:text-cyber-400 mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Concept Remediation:</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {typeof intervention.content.concept_explanation === 'string' 
                    ? intervention.content.concept_explanation 
                    : JSON.stringify(intervention.content.concept_explanation)}
                </p>
              </div>
            )}

            {intervention.content.pedagogical_modality && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="text-slate-500 font-mono">Pedagogical Modality:</span>
                <span className="text-blue-600 dark:text-cyber-300 font-semibold">{intervention.content.pedagogical_modality}</span>
              </div>
            )}

            {intervention.content.visual_diagram_markdown && (
              <div className="p-3 rounded-lg bg-slate-900 dark:bg-obsidian-980 font-mono text-[11px] text-emerald-400 border border-slate-700 dark:border-slate-800/80 overflow-x-auto">
                <pre>{intervention.content.visual_diagram_markdown}</pre>
              </div>
            )}

            {intervention.content.debugging_walkthrough && (
              <div className="space-y-2">
                <div className="font-bold text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Step-by-Step Debugging Walkthrough:</span>
                </div>
                {Array.isArray(intervention.content.debugging_walkthrough) ? (
                  <div className="space-y-2">
                    {intervention.content.debugging_walkthrough.map((stepItem, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-lg bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Step {stepItem.step || sIdx + 1}: {typeof stepItem.state === 'string' ? stepItem.state : ''}
                        </div>
                        {stepItem.code && (
                          <pre className="p-2.5 rounded bg-slate-900 dark:bg-obsidian-980 text-cyan-300 font-mono text-[11px] border border-slate-700 dark:border-slate-800/80 overflow-x-auto">
                            <code>{typeof stepItem.code === 'string' ? stepItem.code : JSON.stringify(stepItem.code)}</code>
                          </pre>
                        )}
                        {stepItem.explanation && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {typeof stepItem.explanation === 'string' ? stepItem.explanation : JSON.stringify(stepItem.explanation)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : typeof intervention.content.debugging_walkthrough === 'object' ? (
                  <pre className="p-2.5 rounded bg-slate-900 dark:bg-obsidian-980 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-700 dark:border-slate-800/80">
                    {JSON.stringify(intervention.content.debugging_walkthrough, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {String(intervention.content.debugging_walkthrough)}
                  </p>
                )}
              </div>
            )}

            {intervention.content.practice_questions && Array.isArray(intervention.content.practice_questions) && (
              <div className="space-y-2">
                <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 mb-1">Targeted Practice Exercises:</div>
                <div className="space-y-2">
                  {intervention.content.practice_questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-3 rounded-lg bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Q{qIdx + 1}: {typeof q === 'string' ? q : q.question || JSON.stringify(q)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!intervention.content.concept_explanation && !intervention.content.debugging_walkthrough && (
              <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                {JSON.stringify(intervention.content, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-line text-slate-600 dark:text-slate-300">{intervention.content || 'No intervention text provided.'}</div>
        )}
      </div>

      {/* Interactive RAM Memory Model for V2 Strategy */}
      {isV2 && (
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Tactile Memory Register Simulation (V2 Interactive Tool)
            </span>
          </div>
          <MemorySimulator />
        </div>
      )}
    </div>
  );
}
