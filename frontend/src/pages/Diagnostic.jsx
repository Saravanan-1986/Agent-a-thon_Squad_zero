import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { startDSADiagnostic, submitDSADiagnostic, submitVerification } from '../services/api';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Zap,
  Code,
  Target,
  FileCheck
} from 'lucide-react';

export default function Diagnostic() {
  const navigate = useNavigate();

  // Diagnostic Test State
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [result, setResult] = useState(null);

  // Verification Modal State
  const [activeVerification, setActiveVerification] = useState(null);
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const studentId = 1;

  // Timer tick
  useEffect(() => {
    let interval;
    if (assessmentData && !result) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [assessmentData, result]);

  // Load diagnostic test on mount
  useEffect(() => {
    async function initDiagnostic() {
      setLoading(true);
      try {
        const data = await startDSADiagnostic(studentId, 12);
        setAssessmentData(data);
      } catch (err) {
        console.error('Failed to load DSA diagnostic:', err);
      } finally {
        setLoading(false);
      }
    }
    initDiagnostic();
  }, []);

  const handleSelectAnswer = (qId, optionVal) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionVal
    }));
  };

  const handleSubmitDiagnostic = async () => {
    if (!assessmentData) return;
    setSubmitting(true);
    try {
      const responsesList = assessmentData.questions.map(q => ({
        question_id: q.id,
        selected_answer: answers[q.id] || '',
        response_time_seconds: 35.0
      }));

      const res = await submitDSADiagnostic(assessmentData.attempt_id, studentId, responsesList);
      setResult(res);
    } catch (err) {
      console.error('Diagnostic submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenVerification = (debt) => {
    setActiveVerification(debt);
    setVerifyAnswer('');
    setVerifyResult(null);
  };

  const handleRunVerification = async () => {
    if (!activeVerification || !verifyAnswer.trim()) return;
    setVerifying(true);
    try {
      const res = await submitVerification(activeVerification.debt_id, {
        question_id: `ver-${activeVerification.debt_id}`,
        answer: verifyAnswer
      });
      setVerifyResult(res);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-cyber-500/20 border-t-cyber-400 animate-spin" />
            <BrainCircuit className="w-8 h-8 text-cyber-400 absolute inset-0 m-auto" />
          </div>
          <h3 className="text-lg font-bold font-display text-white">
            Calibrating DSA Diagnostic Assessment...
          </h3>
          <p className="text-xs text-slate-400">Balancing test distribution across 46 curriculum nodes and cognitive prerequisite depths.</p>
        </div>
      </AppLayout>
    );
  }

  // SCREEN 1: TAKING DIAGNOSTIC ASSESSMENT
  if (!result && assessmentData) {
    const questions = assessmentData.questions || [];
    const currentQ = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Strip */}
          <div className="flex items-center justify-between bg-obsidian-900 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-blue-600 flex items-center justify-center font-bold text-obsidian-950 shadow-md shadow-cyber-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display tracking-tight">DSA Comprehensive Diagnostic</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Question {currentIdx + 1} of {questions.length} • {answeredCount} answered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-obsidian-950 border border-slate-800 text-xs font-mono text-cyber-400">
                <Clock className="w-4 h-4 text-cyber-400" />
                <span>{formatTimer(timer)}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDiagnostic}
                disabled={submitting}
              >
                {submitting ? 'Auditing Responses...' : 'Submit Diagnostic'}
              </Button>
            </div>
          </div>

          {/* Question Card */}
          {currentQ && (
            <Panel className="space-y-6 p-6 border-slate-800 bg-obsidian-900/90 backdrop-blur-xl">
              {/* Question Metadata Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/30 text-cyber-300 text-xs font-mono font-bold uppercase tracking-wider">
                    {currentQ.question_type || 'MCQ'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Code: {currentQ.question_code}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Difficulty: <strong className="text-slate-200">{currentQ.difficulty_label} ({currentQ.difficulty_score})</strong>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-display text-white leading-relaxed">
                  {currentQ.question_text}
                </h3>

                {/* If code snippet is included in options or text */}
                {currentQ.source_reference && (
                  <div className="p-4 rounded-xl bg-obsidian-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                    <pre>{currentQ.source_reference}</pre>
                  </div>
                )}
              </div>

              {/* Selectable Options Grid */}
              <div className="space-y-3 pt-2">
                {currentQ.options && currentQ.options.length > 0 ? (
                  currentQ.options.map((opt, oIdx) => {
                    const optKey = typeof opt === 'object' ? opt.key || opt.text : opt;
                    const optText = typeof opt === 'object' ? opt.text : opt;
                    const isSelected = answers[currentQ.id] === optKey || answers[currentQ.id] === optText;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(currentQ.id, optKey)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-cyber-500/10 border-cyber-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-obsidian-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold font-mono text-xs mt-0.5 ${
                          isSelected
                            ? 'bg-cyber-500 border-cyber-500 text-obsidian-950'
                            : 'border-slate-700 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <div className="text-sm font-medium leading-relaxed">
                          {optText}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-400">Type your answer / code response:</label>
                    <textarea
                      rows={4}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      placeholder="Enter solution or code snippet..."
                      className="w-full p-3.5 rounded-xl border border-slate-800 bg-obsidian-950 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyber-400"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  icon={ArrowLeft}
                >
                  Previous
                </Button>

                {isLast ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitDiagnostic}
                    disabled={submitting}
                    icon={CheckCircle2}
                  >
                    {submitting ? 'Evaluating...' : 'Complete & View Diagnosis'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </Panel>
          )}
        </div>
      </AppLayout>
    );
  }

  // SCREEN 2: RESULTS, ML KNOWLEDGE GAP PREDICTOR, DEBT LEDGER & REMEDIATION
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          category="Diagnostic Results"
          title="DSA Conceptual Health Diagnosis"
          subtitle="Empirical performance analysis powered by Scikit-Learn ML Model & Multi-Hop Root Cause Traversal."
          actions={
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon={RotateCcw}>
              Retake Diagnostic
            </Button>
          }
        />

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Panel className="bg-gradient-to-r from-obsidian-900 to-obsidian-850 text-white p-6 border-slate-800 shadow-xl md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-500 to-blue-500" />
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyber-500/10 text-cyber-300 border border-cyber-500/30">
                  Diagnostic Snapshot
                </span>
                <h2 className="text-2xl font-bold font-display">Overall Accuracy: <span className="text-cyber-400 font-extrabold">{result.overall_score}%</span></h2>
                <p className="text-xs text-slate-400">
                  Answered {result.correct_count} of {result.total_questions} questions correctly across 12 targeted DSA concepts.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-cyber-500/10 border border-cyber-500/30 flex items-center justify-center font-extrabold font-display text-2xl text-cyber-400 shrink-0 shadow-lg shadow-cyber-500/10">
                {result.overall_score}%
              </div>
            </div>
          </Panel>

          <Panel className="p-6 flex flex-col justify-center space-y-2 border-slate-800 bg-obsidian-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Confirmed Debts
            </div>
            <div className="text-3xl font-black font-display text-white">
              {result.debts_created ? result.debts_created.length : 0}
            </div>
            <p className="text-xs text-slate-400">
              Concepts where ML Probability ≥ 65% and diagnostic score &lt; 60%.
            </p>
          </Panel>
        </div>

        {/* Concept Performance Table with ML Gap Probability */}
        <Panel 
          title="Concept Performance & ML Gap Predictor" 
          subtitle="Scikit-Learn Random Forest Classifier inference per concept node"
          className="border-slate-800 bg-obsidian-900/80 backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-950 text-slate-400 uppercase tracking-wider text-[10px] font-mono font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Concept Name</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">ML Knowledge Gap Risk</th>
                  <th className="p-3.5">Deterministic Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.concept_summary && result.concept_summary.map((c, i) => (
                  <tr key={i} className="hover:bg-obsidian-850/60 transition-colors">
                    <td className="p-3.5 font-bold font-display text-white">{c.concept_name}</td>
                    <td className="p-3.5">
                      <span className={`font-mono font-bold ${c.accuracy < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {c.accuracy}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 bg-obsidian-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${c.knowledge_gap_probability >= 0.65 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.round(c.knowledge_gap_probability * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-300">
                          {(c.knowledge_gap_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {c.debt_confirmed ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 font-mono font-bold text-[10px] border border-rose-500/30">
                          CONFIRMED DEBT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                          STABLE / CLEAR
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Confirmed Knowledge Debts & Adaptive LLM Remediation */}
        {result.debts_created && result.debts_created.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Active Knowledge Debts & Multi-Version Remediation
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {result.debts_created.map((debtItem, idx) => (
                <Panel key={idx} className="p-6 border-l-4 border-l-rose-500 border-slate-800 bg-obsidian-900/80 backdrop-blur-xl space-y-6">
                  {/* Debt Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold font-display text-white">
                          {debtItem.concept_name}
                        </h4>
                        <StatusBadge status={debtItem.severity} />
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold">
                          {debtItem.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        ML Gap Risk: <strong className="text-rose-400">{(debtItem.knowledge_gap_probability * 100).toFixed(1)}%</strong>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenVerification(debtItem)}
                      icon={ShieldCheck}
                    >
                      Verify Mastery
                    </Button>
                  </div>

                  {/* Root-Cause Diagnosis */}
                  {debtItem.root_cause && (
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-2 text-xs">
                      <div className="font-bold font-mono text-purple-300 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                        Root-Cause Diagnosis Agent
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {debtItem.root_cause.diagnosis_reasoning || 'Prerequisite gap detected in foundational concepts.'}
                      </p>
                    </div>
                  )}

                  {/* LLM Remediation Plan */}
                  {debtItem.intervention && debtItem.intervention.content && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold font-mono uppercase tracking-wider text-cyber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Remediation Strategy ({debtItem.intervention.version || 'V1'})
                      </div>

                      <div className="p-4 rounded-xl bg-obsidian-950 text-slate-200 space-y-3 text-xs border border-slate-800">
                        <h5 className="font-bold font-display text-cyber-300 text-sm">
                          {debtItem.intervention.content.strategy_title || 'Visual Memory & Pointer Mechanics Strategy'}
                        </h5>
                        <p className="text-slate-300 leading-relaxed">
                          {debtItem.intervention.content.core_explanation || 'Detailed breakdown of concept memory layout.'}
                        </p>

                        {debtItem.intervention.content.code_example && (
                          <div className="p-3 rounded bg-obsidian-980 text-emerald-400 font-mono border border-slate-800/80 overflow-x-auto">
                            <pre>{debtItem.intervention.content.code_example}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* Verification Modal */}
        <AnimatePresence>
          {activeVerification && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-980/80 backdrop-blur-md p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-obsidian-900 rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-6 text-slate-100"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-cyber-400" />
                    <h3 className="text-lg font-bold font-display text-white">
                      Verification Challenge: {activeVerification.concept_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveVerification(null)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-slate-400">
                    Solve this fresh verification question to empirically prove mastery and repay the Knowledge Debt.
                  </p>

                  <div className="p-4 rounded-xl bg-obsidian-950 border border-slate-800 space-y-2 font-mono text-slate-200">
                    <p className="font-bold text-sm text-cyber-300">Verification Challenge:</p>
                    <p>In C++, if `int* p = &x;`, what does `*p` evaluate to when `x = 42`?</p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-300 font-mono">Your Answer:</label>
                    <input
                      type="text"
                      value={verifyAnswer}
                      onChange={e => setVerifyAnswer(e.target.value)}
                      placeholder="Enter answer (e.g. 42)"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-obsidian-950 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyber-400"
                    />
                  </div>

                  {verifyResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border text-xs font-bold font-mono ${
                        verifyResult.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {verifyResult.passed ? '✓ PASSED! Knowledge Debt → REPAID' : '✗ FAILED verification. Adapting intervention strategy...'}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button variant="ghost" size="sm" onClick={() => setActiveVerification(null)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRunVerification}
                    disabled={verifying || !verifyAnswer.trim()}
                  >
                    {verifying ? 'Evaluating Evidence...' : 'Submit Verification'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
