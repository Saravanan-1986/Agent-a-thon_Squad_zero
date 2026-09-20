import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemTrace, getThinkingSteps, getEngineStatus, getApiBaseUrl } from '../services/api';
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
  RotateCcw,
  Radio
} from 'lucide-react';
import MarkdownRenderer from './ui/MarkdownRenderer';

export default function SystemTraceDrawer({ studentId = 1, isOpen = false, onClose }) {
  const [activeTab, setActiveTab] = useState('THINKING');
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [events, setEvents] = useState([]);
  const [engineStatus, setEngineStatus] = useState({ active_provider: 'deterministic_fallback', mode: 'OFFLINE' });
  const [loading, setLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const eventSourceRef = useRef(null);

  const PHASES = [
    { key: 'Observe', label: 'Observe', icon: Eye, color: 'text-[#2E90FA] border-[#2E90FA]/30 bg-[#EFF8FF] dark:bg-[#2E90FA]/20' },
    { key: 'Reason', label: 'Reason', icon: BrainCircuit, color: 'text-[#5B4BFF] border-[#5B4BFF]/30 bg-[#EEECFF] dark:bg-[#5B4BFF]/20' },
    { key: 'Act', label: 'Act', icon: Zap, color: 'text-[#FF6A2B] border-[#FF6A2B]/30 bg-[#FFF0EA] dark:bg-[#FF6A2B]/20' },
    { key: 'Verify', label: 'Verify', icon: ShieldCheck, color: 'text-[#F79009] border-[#F79009]/30 bg-[#FEF6E7] dark:bg-[#F79009]/20' },
    { key: 'Adapt', label: 'Adapt', icon: RotateCcw, color: 'text-[#12B76A] border-[#12B76A]/30 bg-[#E8FDF2] dark:bg-[#12B76A]/20' },
  ];

  const fetchStaticData = async () => {
    setLoading(true);
    try {
      const [eventsRes, thinkingRes, statusRes] = await Promise.all([
        getSystemTrace(studentId),
        getThinkingSteps(studentId),
        getEngineStatus()
      ]);
      setEvents(eventsRes?.events || []);
      setThinkingSteps(thinkingRes || []);
      if (statusRes) setEngineStatus(statusRes);
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

    fetchStaticData();

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
        fetchStaticData();
      };
    } catch (err) {
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
        return { label: 'Evidence Recorded', color: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]', icon: Activity };
      case 'DEBT_CREATED':
      case 'DEBT_CONFIRMED':
        return { label: 'Debt Spotted', color: 'bg-[#FEE4E2] text-[#B42318] border-[#FECDCA]', icon: AlertTriangle };
      case 'DEBT_STATUS_TRANSITION':
        return { label: 'State Transition', color: 'bg-[#FEF6E7] text-[#B54708] border-[#FDECAB]', icon: ShieldCheck };
      case 'ROOT_CAUSE_DIAGNOSED':
        return { label: 'Diagnosis Agent', color: 'bg-[#EEECFF] text-[#4A3AE0] border-[#C7D2FE]', icon: Cpu };
      case 'INTERVENTION_PROPOSED':
      case 'NEW_INTERVENTION_GENERATED':
        return { label: 'Lesson Generated', color: 'bg-[#FFF0EA] text-[#FF6A2B] border-[#FFD3C2]', icon: Zap };
      default:
        return { label: 'System Event', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Terminal };
    }
  };

  const getPhaseBadge = (phase) => {
    const p = PHASES.find(x => x.key === phase);
    return p || { label: phase, color: 'text-slate-600 bg-slate-100 border-slate-200', icon: Terminal };
  };

  const latestPhase = thinkingSteps.length > 0 ? thinkingSteps[thinkingSteps.length - 1].phase : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full max-w-xl bg-white dark:bg-[#1A204C] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-full text-[#1B2150] dark:text-[#F1F5F9]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#14183A]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEECFF] dark:bg-[#5B4BFF]/20 flex items-center justify-center text-[#5B4BFF] dark:text-[#818CF8]">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    Agent Thinking Trace
                    {isLiveConnected ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#12B76A] bg-[#E8FDF2] dark:bg-[#12B76A]/20 px-2 py-0.5 rounded-full font-bold">
                        <Radio className="w-3 h-3 animate-pulse" /> Live Stream
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8C94B2] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                        Polling
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#5F6788] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                    <span>Real-time AI reasoning & state transitions</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight border ${
                      engineStatus?.mode === 'REAL' 
                        ? 'bg-[#EEECFF] text-[#5B4BFF] border-[#5B4BFF]/30 dark:bg-[#5B4BFF]/20 dark:text-[#818CF8]' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {engineStatus?.display_badge || (engineStatus?.mode === 'REAL' ? 'OpenRouter → Gemini 2.0 Flash Lite (REAL)' : 'deterministic_fallback (OFFLINE)')}
                    </span>
                  </p>

                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStaticData}
                  disabled={loading}
                  className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 text-[#5F6788] dark:text-[#94A3B8] transition-colors"
                  title="Refresh trace"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 text-[#5F6788] dark:text-[#94A3B8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 5-Step Agent Lifecycle */}
            <div className="p-3 bg-slate-100/70 dark:bg-[#121633] border-b border-slate-200 dark:border-white/5 overflow-x-auto">
              <div className="flex items-center justify-between gap-1.5 min-w-[450px]">
                {PHASES.map((p, idx) => {
                  const Icon = p.icon;
                  const isCurrent = latestPhase === p.key;
                  const hasHappened = thinkingSteps.some(s => s.phase === p.key);
                  return (
                    <React.Fragment key={p.key}>
                      <div className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all
                        ${isCurrent 
                          ? `${p.color} ring-2 ring-[#FF6A2B]` 
                          : hasHappened 
                            ? 'bg-white dark:bg-[#22295E] text-[#1B2150] dark:text-white border-slate-300 dark:border-white/10' 
                            : 'bg-slate-200/50 dark:bg-white/5 text-[#8C94B2] border-transparent'
                        }
                      `}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{p.label}</span>
                      </div>
                      {idx < PHASES.length - 1 && (
                        <span className="text-[#8C94B2] font-bold text-xs">&rarr;</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/10 px-4 pt-2 gap-2 text-xs font-bold bg-slate-50/50 dark:bg-[#14183A]">
              <button
                onClick={() => setActiveTab('THINKING')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'THINKING'
                    ? 'border-[#FF6A2B] text-[#FF6A2B]'
                    : 'border-transparent text-[#5F6788] hover:text-[#1B2150] dark:hover:text-white'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                Agent Timeline ({thinkingSteps.length})
              </button>
              <button
                onClick={() => setActiveTab('EVENTS')}
                className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'EVENTS'
                    ? 'border-[#FF6A2B] text-[#FF6A2B]'
                    : 'border-transparent text-[#5F6788] hover:text-[#1B2150] dark:hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Audit Logs ({events.length})
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'THINKING' && (
                <>
                  {thinkingSteps.length === 0 ? (
                    <div className="text-center py-16 text-[#5F6788] dark:text-[#94A3B8] text-xs space-y-2">
                      <BrainCircuit className="w-8 h-8 mx-auto text-[#8C94B2] animate-pulse" />
                      <p>Awaiting live agent thinking cycle...</p>
                    </div>
                  ) : (
                    thinkingSteps.map((step, idx) => {
                      const badge = getPhaseBadge(step.phase);
                      const Icon = badge.icon;
                      return (
                        <motion.div
                          key={step.id || idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-card-light dark:bg-[#22295E] border border-slate-200/80 dark:border-white/10 space-y-2 text-xs shadow-soft"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                <Icon className="w-3 h-3" />
                                {step.phase}
                              </span>
                              <span className="font-bold text-[#1B2150] dark:text-[#F1F5F9]">{step.agent}</span>
                            </div>
                            <span className="text-[11px] text-[#8C94B2]">
                              {step.timestamp || 'Just now'}
                            </span>
                          </div>

                          <div className="mt-1">
                            <MarkdownRenderer content={step.message} />
                          </div>

                          {step.metadata && Object.keys(step.metadata).length > 0 && (
                            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                              <pre>{JSON.stringify(step.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === 'EVENTS' && (
                <>
                  {events.length === 0 ? (
                    <div className="text-center py-16 text-[#5F6788] dark:text-[#94A3B8] text-xs space-y-2">
                      <Terminal className="w-8 h-8 mx-auto text-[#8C94B2]" />
                      <p>No audit events recorded yet.</p>
                    </div>
                  ) : (
                    events.map((ev, idx) => {
                      const badge = getEventBadge(ev.event_type);
                      const Icon = badge.icon;
                      return (
                        <motion.div
                          key={ev.id || idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-card-light dark:bg-[#22295E] border border-slate-200/80 dark:border-white/10 space-y-2 text-xs shadow-soft"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                <Icon className="w-3 h-3" />
                                {badge.label}
                              </span>
                              <span className="font-bold text-[#1B2150] dark:text-[#F1F5F9]">{ev.event_type}</span>
                            </div>
                            <span className="text-[11px] text-[#8C94B2]">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>

                          {ev.payload && (
                            <div className="p-3 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto">
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

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#14183A] text-xs text-[#5F6788] dark:text-[#94A3B8] flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#12B76A]" />
                LLM proposes. Deterministic code decides.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
