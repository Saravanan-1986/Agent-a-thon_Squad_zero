import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import SystemTraceDrawer from '../components/SystemTraceDrawer';
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
  Code
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
          <BrainCircuit className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Initializing DSA Diagnostic Assessment...
          </h3>
          <p className="text-sm text-slate-500">Generating balanced question set across core data structure concepts.</p>
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
        <SystemTraceDrawer studentId={studentId} />

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Strip */}
          <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4 rounded-xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">DSA Comprehensive Diagnostic</h2>
                <p className="text-xs text-slate-300">
                  Question {currentIdx + 1} of {questions.length} • {answeredCount} answered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-blue-400">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{formatTimer(timer)}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDiagnostic}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? 'Analyzing Responses...' : 'Submit Diagnostic'}
              </Button>
            </div>
          </div>

          {/* Question Card */}
          {currentQ && (
            <Panel className="space-y-6 p-6">
              {/* Question Metadata Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    {currentQ.question_type || 'MCQ'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Code: {currentQ.question_code}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Difficulty: <strong className="text-slate-800 dark:text-slate-200">{currentQ.difficulty_label} ({currentQ.difficulty_score})</strong>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentQ.question_text}
                </h3>

                {/* If code snippet is included in options or text */}
                {currentQ.source_reference && (
                  <div className="p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
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
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          {optText}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Type your answer / code response:</label>
                    <textarea
                      rows={4}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      placeholder="Enter solution or code snippet..."
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
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
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? 'Submitting...' : 'Complete & View Diagnosis'}
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
      <SystemTraceDrawer studentId={studentId} />

      <div className="space-y-6">
        <PageHeader
          category="Diagnostic Results"
          title="DSA Conceptual Health Diagnosis"
          subtitle="Empirical performance analysis powered by Scikit-Learn ML Model & Deterministic Decision Engine."
          actions={
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon={RotateCcw}>
              Retake Diagnostic
            </Button>
          }
        />

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Panel className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 border-0 shadow-md md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Diagnostic Snapshot
                </span>
                <h2 className="text-2xl font-bold">Overall Score: <span className="text-blue-400 font-extrabold">{result.overall_score}%</span></h2>
                <p className="text-xs text-slate-300">
                  Answered {result.correct_count} of {result.total_questions} questions correctly across 12 DSA concepts.
                </p>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-extrabold text-2xl text-blue-400 shrink-0">
                {result.overall_score}%
              </div>
            </div>
          </Panel>

          <Panel className="p-6 flex flex-col justify-center space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Confirmed Debts
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {result.debts_created ? result.debts_created.length : 0}
            </div>
            <p className="text-xs text-slate-500">
              Concepts where ML Probability ≥ 65% and score &lt; 60%.
            </p>
          </Panel>
        </div>

        {/* Concept Performance Table with ML Gap Probability */}
        <Panel title="Concept Performance & ML Gap Predictor" subtitle="Scikit-Learn Random Forest Classifier inference per concept">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Concept Name</th>
                  <th className="p-3.5">Diagnostic Accuracy</th>
                  <th className="p-3.5">ML Knowledge Gap Prob</th>
                  <th className="p-3.5">Deterministic Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {result.concept_summary && result.concept_summary.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{c.concept_name}</td>
                    <td className="p-3.5">
                      <span className={`font-mono font-bold ${c.accuracy < 60 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {c.accuracy}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${c.knowledge_gap_probability >= 0.65 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.round(c.knowledge_gap_probability * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">
                          {(c.knowledge_gap_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {c.debt_confirmed ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] border border-rose-300 dark:border-rose-800">
                          CONFIRMED DEBT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
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
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Active Knowledge Debts & Multi-Version LLM Remediation
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {result.debts_created.map((debtItem, idx) => (
                <Panel key={idx} className="p-6 border-l-4 border-l-rose-500 space-y-6">
                  {/* Debt Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {debtItem.concept_name}
                        </h4>
                        <StatusBadge status={debtItem.severity} />
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                          {debtItem.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ML Gap Risk: <strong className="text-rose-600">{(debtItem.knowledge_gap_probability * 100).toFixed(1)}%</strong>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenVerification(debtItem)}
                      icon={ShieldCheck}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Verify Mastery
                    </Button>
                  </div>

                  {/* Root-Cause Diagnosis */}
                  {debtItem.root_cause && (
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                      <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Root-Cause Diagnosis Agent
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {debtItem.root_cause.diagnosis_reasoning || 'Prerequisite gap detected in foundational concepts.'}
                      </p>
                    </div>
                  )}

                  {/* LLM Remediation Plan */}
                  {debtItem.intervention && debtItem.intervention.content && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Remediation Strategy ({debtItem.intervention.version || 'V1'})
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-4 text-xs">
                        <h5 className="font-bold text-blue-400 text-sm">
                          {debtItem.intervention.content.strategy_title || 'Visual Memory & Pointer Mechanics Strategy'}
                        </h5>
                        <p className="text-slate-300 leading-relaxed">
                          {debtItem.intervention.content.core_explanation || 'Detailed breakdown of concept memory layout.'}
                        </p>

                        {debtItem.intervention.content.code_example && (
                          <div className="p-3 rounded bg-slate-950 text-emerald-400 font-mono border border-slate-800 overflow-x-auto">
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
        {activeVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Verification Challenge: {activeVerification.concept_name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveVerification(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-300">
                  Solve this fresh verification question to empirically prove mastery and repay the Knowledge Debt.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-slate-800 dark:text-slate-200">
                  <p className="font-bold text-sm">Verification Question:</p>
                  <p>In C++, if `int* p = &x;`, what does `*p` evaluate to when `x = 42`?</p>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Your Answer:</label>
                  <input
                    type="text"
                    value={verifyAnswer}
                    onChange={e => setVerifyAnswer(e.target.value)}
                    placeholder="Enter answer (e.g. 42)"
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {verifyResult && (
                  <div className={`p-4 rounded-xl border text-xs font-bold ${
                    verifyResult.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300'
                  }`}>
                    {verifyResult.passed ? '✓ PASSED! Knowledge Debt → REPAID' : '✗ FAILED verification. Adapting intervention strategy...'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setActiveVerification(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRunVerification}
                  disabled={verifying || !verifyAnswer.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {verifying ? 'Evaluating Evidence...' : 'Submit Verification'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
