import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemTrace, getThinkingSteps, getApiBaseUrl } from '../services/api';
import { 
  Terminal, 
  X, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  AlertTriangle, 
  Zap, 
  Eye, 
  BrainCircuit, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Radio
} from 'lucide-react';

export default function SystemTraceDrawer({ studentId = 1 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('THINKING'); // THINKING | EVENTS
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const eventSourceRef = useRef(null);

  const PHASES = [
    { key: 'Observe', label: 'Observe', icon: Eye, color: 'text-cyber-400 border-cyber-500/40 bg-cyber-500/10' },
    { key: 'Reason', label: 'Reason', icon: BrainCircuit, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
    { key: 'Act', label: 'Act', icon: Zap, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    { key: 'Verify', label: 'Verify', icon: ShieldCheck, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { key: 'Adapt', label: 'Adapt', icon: RotateCcw, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  ];

  const fetchStaticData = async () => {
    setLoading(true);
    try {
      const [eventsRes, thinkingRes] = await Promise.all([
        getSystemTrace(studentId),
        getThinkingSteps(studentId)
      ]);
      setEvents(eventsRes?.events || []);
      setThinkingSteps(thinkingRes || []);
    } catch (err) {
      console.warn('[TraceDrawer] Error loading trace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsLiveConnected(false);
      }
      return;
    }

    // Initial load
    fetchStaticData();

    // Connect Server-Sent Events (SSE) stream for live real-time trace
    const sseUrl = `${getApiBaseUrl()}/api/system/trace/${studentId}/stream`;
    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsLiveConnected(true);
      };

      es.addEventListener('thinking_step', (e) => {
        try {
          const step = JSON.parse(e.data);
          setThinkingSteps((prev) => {
            if (prev.some(s => s.id === step.id)) return prev;
            return [...prev, step];
          });
        } catch (err) {
          console.warn('[SSE Parse Error]:', err);
        }
      });

      es.onerror = () => {
        setIsLiveConnected(false);
        // Fall back to polling if SSE disconnected
        fetchStaticData();
      };
    } catch (err) {
      console.warn('[SSE Connection Failed, fallback to polling]:', err);
      const interval = setInterval(fetchStaticData, 3000);
      return () => clearInterval(interval);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsLiveConnected(false);
      }
    };
  }, [isOpen, studentId]);

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'EVIDENCE_RECORDED':
      case 'EVIDENCE_SUBMITTED':
        return { label: 'EVIDENCE', color: 'bg-cyber-500/20 text-cyber-400 border-cyber-500/40', icon: Activity };
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
        return { label: 'SYSTEM EVENT', color: 'bg-obsidian-800 text-slate-300 border-obsidian-700', icon: Terminal };
    }
  };

  const getPhaseBadge = (phase) => {
    const p = PHASES.find(x => x.key === phase);
    return p || { label: phase, color: 'text-slate-300 border-obsidian-700 bg-obsidian-800', icon: Terminal };
  };

  const latestPhase = thinkingSteps.length > 0 ? thinkingSteps[thinkingSteps.length - 1].phase : null;

  return (
    <>
      {/* Floating Observability Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-obsidian-950/90 backdrop-blur-md text-cyber-400 border border-cyber-500/40 shadow-glow hover:border-cyber-400 transition-all font-mono text-xs font-semibold cursor-pointer"
      >
        <Terminal className="w-4 h-4 text-cyber-400 animate-pulse" />
        <span className="tracking-wide">Agent Thinking Trace</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500"></span>
        </span>
        {thinkingSteps.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-cyber-500/20 text-cyber-300 text-[10px] font-bold border border-cyber-500/30">
            {thinkingSteps.length}
          </span>
        )}
      </motion.button>

      {/* Slide-over Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-obsidian-980/70 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-2xl bg-obsidian-950 border-l border-obsidian-800 shadow-2xl flex flex-col h-full text-slate-100 font-mono"
            >
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-obsidian-800 flex items-center justify-between bg-obsidian-900/90">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyber-950 border border-cyber-500/40 flex items-center justify-center shadow-glow">
                    <Terminal className="w-4 h-4 text-cyber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-display">
                      Real-Time Observability & Thinking Trace
                      {isLiveConnected ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold font-mono">
                          <Radio className="w-3 h-3 animate-pulse" /> SSE LIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-obsidian-800 px-2 py-0.5 rounded-full font-mono">
                          POLLING
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Dual Engine: LLM Proposes (Gemini) • State Machine Decides
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchStaticData}
                    disabled={loading}
                    className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs transition-colors cursor-pointer"
                    title="Refresh Trace"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 5-Step Thinking Lifecycle Banner */}
              <div className="p-3 bg-obsidian-900/60 border-b border-obsidian-800 overflow-x-auto custom-scrollbar">
                <div className="flex items-center justify-between gap-1.5 min-w-[500px]">
                  {PHASES.map((p, idx) => {
                    const Icon = p.icon;
                    const isCurrent = latestPhase === p.key;
                    const hasHappened = thinkingSteps.some(s => s.phase === p.key);
                    return (
                      <React.Fragment key={p.key}>
                        <div className={`
                          flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-all
                          ${isCurrent 
                            ? `${p.color} ring-1 ring-cyber-400 shadow-glow` 
                            : hasHappened 
                              ? 'bg-obsidian-850 text-slate-300 border-obsidian-700' 
                              : 'bg-obsidian-950 text-slate-600 border-obsidian-850'
                          }
                        `}>
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{p.label}</span>
                        </div>
                        {idx < PHASES.length - 1 && (
                          <span className="text-obsidian-700 font-bold">→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-obsidian-800 bg-obsidian-950 px-4 pt-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('THINKING')}
                  className={`px-3 py-1.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'THINKING'
                      ? 'border-cyber-400 text-cyber-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Thinking Steps ({thinkingSteps.length})
                </button>
                <button
                  onClick={() => setActiveTab('EVENTS')}
                  className={`px-3 py-1.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'EVENTS'
                      ? 'border-cyber-400 text-cyber-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Database Audit Log ({events.length})
                </button>
              </div>

              {/* Trace Stream Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-obsidian-950 custom-scrollbar">
                
                {/* TAB 1: THINKING STEPS */}
                {activeTab === 'THINKING' && (
                  <>
                    {thinkingSteps.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 text-xs space-y-2">
                        <BrainCircuit className="w-8 h-8 mx-auto text-obsidian-700 animate-pulse" />
                        <p>Awaiting live agent thinking cycle...</p>
                        <p className="text-[10px] font-mono text-slate-600">Observe ➔ Reason ➔ Act ➔ Verify ➔ Adapt</p>
                      </div>
                    ) : (
                      thinkingSteps.map((step, idx) => {
                        const badge = getPhaseBadge(step.phase);
                        const Icon = badge.icon;
                        return (
                          <motion.div
                            key={step.id || idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-xl bg-obsidian-900/90 border border-obsidian-800 hover:border-obsidian-700 transition-colors space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                  <Icon className="w-3 h-3" />
                                  [{step.phase}]
                                </span>
                                <span className="font-bold text-slate-200">{step.agent}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {step.timestamp || 'Just now'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {step.message}
                            </p>

                            {step.metadata && Object.keys(step.metadata).length > 0 && (
                              <div className="p-2.5 rounded-lg bg-obsidian-950 border border-obsidian-800 overflow-x-auto text-[11px] text-emerald-400 font-mono custom-scrollbar">
                                <pre>{JSON.stringify(step.metadata, null, 2)}</pre>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </>
                )}

                {/* TAB 2: PERSISTED AUDIT LOG */}
                {activeTab === 'EVENTS' && (
                  <>
                    {events.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 text-xs space-y-2">
                        <Terminal className="w-8 h-8 mx-auto text-obsidian-700" />
                        <p>No audit events recorded for Student ID: {studentId}.</p>
                      </div>
                    ) : (
                      events.map((ev, idx) => {
                        const badge = getEventBadge(ev.event_type);
                        const Icon = badge.icon;
                        return (
                          <motion.div
                            key={ev.id || idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-xl bg-obsidian-900/90 border border-obsidian-800 hover:border-obsidian-700 transition-colors space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                  <Icon className="w-3 h-3" />
                                  {badge.label}
                                </span>
                                <span className="font-bold text-slate-200">{ev.event_type}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                              </span>
                            </div>

                            {ev.payload && (
                              <div className="p-2.5 rounded-lg bg-obsidian-950 border border-obsidian-800 overflow-x-auto text-[11px] text-cyber-300 leading-relaxed font-mono custom-scrollbar">
                                <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </>
                )}

              </div>

              {/* Footer Legend */}
              <div className="px-5 py-3 border-t border-obsidian-800 bg-obsidian-900/70 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyber-400" />
                  Rule: LLM proposes. Deterministic state machine decides.
                </span>
                <span className="text-cyber-400 font-bold uppercase tracking-wider font-mono">
                  LIVE OBSERVABILITY
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

