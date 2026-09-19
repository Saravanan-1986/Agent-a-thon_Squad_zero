import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, Clock, ShieldCheck, CheckCircle2, XCircle, Hash, ArrowUpRight } from 'lucide-react';

export default function EvidenceTimeline({ evidenceList = [] }) {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-obsidian-950/60 border border-slate-800 text-xs text-slate-400 text-center space-y-2">
        <FileCode className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-semibold text-slate-300">No empirical evidence signals match the current query.</p>
        <p className="text-[11px] text-slate-500">Run a diagnostic assessment or complete a verification challenge to generate evidence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative pl-6 border-l-2 border-slate-800/80 my-2">
      {evidenceList.map((item, index) => {
        const isPass = item.passed;
        const fakeHash = `sig_${(item.id || index * 7919 + 104729).toString(16).slice(-6)}`;

        return (
          <motion.div 
            key={item.id || index} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="relative group"
          >
            {/* Timeline node icon */}
            <div 
              className={`absolute -left-[33px] top-3.5 w-5 h-5 rounded-full border-2 bg-obsidian-950 flex items-center justify-center transition-transform group-hover:scale-110 ${
                isPass 
                  ? 'border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : 'border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isPass ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            </div>

            {/* Content card */}
            <div className="p-4 rounded-xl bg-obsidian-850/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2 shadow-md hover:shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Pseudo hash chip */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-950 text-slate-400 border border-slate-800 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-500" />
                    {fakeHash}
                  </span>

                  <span className="text-xs font-bold font-display text-white">
                    {item.source}
                  </span>

                  {item.concept && (
                    <span className="text-xs font-mono font-semibold text-cyber-400 bg-cyber-500/10 px-2.5 py-0.5 rounded-full border border-cyber-500/30">
                      {item.concept}
                    </span>
                  )}

                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    isPass 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {isPass ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                    {isPass ? 'EMPIRICAL PASS' : 'EVIDENCE DEFICIT'} (Score: {item.score})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{item.timestamp || 'Recorded recently'}</span>
                </div>

              </div>

              {item.detail && (
                <div className="text-xs text-slate-300 pl-3 border-l-2 border-slate-700/60 font-sans italic bg-obsidian-950/40 p-2 rounded-r-lg">
                  "{item.detail}"
                </div>
              )}

              {/* Impact Note */}
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isPass ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>
                    Deterministic Impact: <strong className={isPass ? 'text-emerald-300' : 'text-rose-300'}>
                      {isPass ? 'Advances debt state toward REPAID resolution.' : 'Triggers confirmed debt & root-cause traversal.'}
                    </strong>
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-0.5">
                  Audited <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
