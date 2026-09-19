import React, { useState, useEffect } from 'react';
import { getSystemTrace } from '../services/api';
import { Terminal, X, RefreshCw, Activity, ShieldCheck, Cpu, AlertTriangle, Zap } from 'lucide-react';

export default function SystemTraceDrawer({ studentId = 1 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrace = async () => {
    setLoading(true);
    try {
      const data = await getSystemTrace(studentId);
      setEvents(data.events || []);
    } catch (err) {
      console.warn('Trace fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrace();
      const interval = setInterval(fetchTrace, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, studentId]);

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'EVIDENCE_RECORDED':
      case 'EVIDENCE_SUBMITTED':
        return { label: 'EVIDENCE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Activity };
      case 'DEBT_CREATED':
      case 'DEBT_CONFIRMED':
        return { label: 'DEBT DETECTED', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: AlertTriangle };
      case 'DEBT_STATUS_TRANSITION':
        return { label: 'STATE MACHINE', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: ShieldCheck };
      case 'ROOT_CAUSE_DIAGNOSED':
        return { label: 'DIAGNOSIS AGENT', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: Cpu };
      case 'INTERVENTION_PROPOSED':
      case 'NEW_INTERVENTION_GENERATED':
        return { label: 'LLM INTERVENTION', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', icon: Zap };
      default:
        return { label: 'SYSTEM EVENT', color: 'bg-slate-700 text-slate-300 border-slate-600', icon: Terminal };
    }
  };

  return (
    <>
      {/* Floating Observability Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-xl hover:bg-slate-800 transition-all font-mono text-xs font-semibold hover:scale-105"
      >
        <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>System Agent Trace</span>
        {events.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            {events.length}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100 font-mono">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-500/30 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    System Agent Trace & Audit Log
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dual observability • LLM propose & Deterministic decide
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTrace}
                  disabled={loading}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 text-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trace Stream Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {events.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-slate-700" />
                  <p>No agent events logged yet for Student ID: {studentId}.</p>
                  <p className="text-[10px]">Take a diagnostic test or trigger evidence to watch live events.</p>
                </div>
              ) : (
                events.map((ev, idx) => {
                  const badge = getEventBadge(ev.event_type);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={ev.id || idx}
                      className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="font-bold text-slate-200">{ev.event_type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>

                      {ev.payload && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800/60 overflow-x-auto text-[11px] text-emerald-300/90 leading-relaxed font-mono">
                          <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Legend */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Rule: LLM proposes. Deterministic code decides.</span>
              <span className="text-emerald-400 font-bold">LIVE AGENT TRACE</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
