import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import { startDSADiagnostic, submitDSADiagnostic, submitVerification } from '../services/api';
import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Zap,
  Info,
  X
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
  const [showDetails, setShowDetails] = useState(false);

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

  // Keyboard shortcut listener (A, B, C, D keys)
  useEffect(() => {
    if (!assessmentData || result) return;
    const questions = assessmentData.questions || [];
    const currentQ = questions[currentIdx];
    if (!currentQ || !currentQ.options) return;

    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const optIdx = key.charCodeAt(0) - 65;
        if (optIdx < currentQ.options.length) {
          const opt = currentQ.options[optIdx];
          const optKey = typeof opt === 'object' ? opt.key || opt.text : opt;
          handleSelectAnswer(currentQ.id, optKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assessmentData, result, currentIdx]);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#FF6A2B] border-t-transparent animate-spin" />
          <h3 className="text-lg font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            Preparing Your Diagnostic Quiz...
          </h3>
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">Loading questions across key DSA topics.</p>
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
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          
          {/* Subtitle & Timer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft">
            <div>
              <h1 className="text-xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                Diagnostic Quiz
              </h1>
              <p className="text-xs text-[#5F6788] dark:text-[#94A3B8] font-medium mt-0.5">
                Answer each question to check your understanding. Keyboard shortcuts (A-D) enabled.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EFF8FF] text-[#175CD3] dark:bg-[#2E90FA]/15 dark:text-[#60A5FA] border border-[#B2DDFF] dark:border-[#2E90FA]/30 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>Timer: {formatTimer(timer)}</span>
              </div>
            </div>
          </div>

          {/* Question Dots Progress Bar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto p-2 bg-card-light dark:bg-card-dark rounded-xl border border-slate-200/80 dark:border-white/10">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;

              let dotClass = 'bg-slate-200 dark:bg-slate-700 text-slate-500';
              if (isAnswered) dotClass = 'bg-[#12B76A] text-white';
              if (isCurrent) dotClass = 'bg-[#FF6A2B] text-white ring-2 ring-[#FF6A2B]/40 scale-110';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${dotClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          {currentQ && (
            <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
                <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8]">
                  Question {currentIdx + 1} of {questions.length}
                </span>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-semibold text-[#8C94B2] hover:text-[#1B2150] dark:hover:text-white flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showDetails ? 'Hide Details' : 'Details'}
                </button>
              </div>

              {showDetails && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#22295E] text-[11px] font-mono text-[#5F6788] dark:text-[#94A3B8]">
                  Code: {currentQ.question_code} | Type: {currentQ.question_type} | Difficulty: {currentQ.difficulty_label}
                </div>
              )}

              {/* Question Text */}
              <div>
                <MarkdownRenderer content={currentQ.question_text} className="text-base font-bold" />

                {currentQ.source_reference && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                    <pre>{currentQ.source_reference}</pre>
                  </div>
                )}
              </div>

              {/* Selectable Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options && currentQ.options.length > 0 ? (
                  currentQ.options.map((opt, oIdx) => {
                    const optKey = typeof opt === 'object' ? opt.key || opt.text : opt;
                    const optText = typeof opt === 'object' ? opt.text : opt;
                    const isSelected = answers[currentQ.id] === optKey || answers[currentQ.id] === optText;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(currentQ.id, optKey)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEECFF] dark:bg-[#5B4BFF]/20 border-[#5B4BFF] text-[#1B2150] dark:text-white shadow-soft font-semibold'
                            : 'bg-white dark:bg-[#22295E] border-slate-200 dark:border-white/10 hover:border-slate-300 text-[#5F6788] dark:text-[#94A3B8]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                          isSelected
                            ? 'bg-[#5B4BFF] border-[#5B4BFF] text-white'
                            : 'border-slate-300 dark:border-slate-600 text-[#8C94B2]'
                        }`}>
                          {letter}
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed mt-1">
                          {optText}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <textarea
                    rows={4}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#22295E] text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
                  />
                )}
              </div>

              {/* Card Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
                <Button
                  variant="ghost"
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
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
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

            </div>
          )}

          {/* Sticky Submit Footer Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#1A204C]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-4 shadow-soft-lg">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <span className="text-xs font-bold text-[#5F6788] dark:text-[#94A3B8]">
                {answeredCount} of {questions.length} questions answered
              </span>

              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitDiagnostic}
                disabled={submitting || answeredCount === 0}
                icon={CheckCircle2}
              >
                {submitting ? 'Evaluating...' : 'Submit Quiz Now'}
              </Button>
            </div>
          </div>

        </div>
      </AppLayout>
    );
  }

  // SCREEN 2: RESULTS SCREEN
  if (!result) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-8 text-center space-y-4 bg-card-light dark:bg-card-dark rounded-[20px] border border-slate-200 dark:border-white/10 shadow-soft">
          <BrainCircuit className="w-12 h-12 mx-auto text-[#FF6A2B] animate-pulse" />
          <h2 className="text-xl font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            Diagnostic Assessment Ready
          </h2>
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
            Click below to start or refresh your diagnostic test.
          </p>
          <Button variant="primary" size="md" onClick={() => window.location.reload()}>
            Start Diagnostic Test
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#FF6A2B] to-[#FF8048] text-white shadow-soft-lg space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnostic Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Your Overall Score: {result?.overall_score ?? 0}%
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            You answered {result?.correct_count ?? 0} out of {result?.total_questions ?? 0} questions correctly.
          </p>
        </div>

        {/* Confirmed Debts & Remediation List */}
        {result?.debts_created && result.debts_created.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
              Identified Topic Gaps
            </h3>

            {result.debts_created.map((debtItem, idx) => (
              <div key={idx} className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                    {debtItem.concept_name}
                  </h4>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenVerification(debtItem)}
                  >
                    Prove Mastery
                  </Button>
                </div>

                {debtItem.intervention && debtItem.intervention.content && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#22295E] space-y-2">
                    <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8] block">
                      {debtItem.intervention.content.strategy_title || 'Tailored Lesson Plan'}
                    </span>
                    <MarkdownRenderer content={debtItem.intervention.content.core_explanation} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 text-center text-xs text-[#5F6788]">
            Great job! No persistent knowledge debts were created from this attempt.
          </div>
        )}

        <div className="pt-4 flex justify-center gap-4">
          <Button variant="secondary" onClick={() => window.location.reload()} icon={RotateCcw}>
            Retake Diagnostic
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')} icon={ArrowRight} iconPosition="right">
            Back to Overview
          </Button>
        </div>

        {/* Verification Check-up Modal */}
        <AnimatePresence>
          {activeVerification && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg bg-white dark:bg-[#1A204C] rounded-[20px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                    Prove Mastery: {activeVerification.concept_name}
                  </h3>
                  <button onClick={() => setActiveVerification(null)} className="text-[#8C94B2]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-[#5F6788] dark:text-[#94A3B8]">
                    In C++, if `int* p = &x;`, what does `*p` evaluate to when `x = 42`?
                  </p>
                  <input
                    type="text"
                    value={verifyAnswer}
                    onChange={e => setVerifyAnswer(e.target.value)}
                    placeholder="Enter answer (e.g. 42)"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#22295E] text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
                  />

                  {verifyResult && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${verifyResult.passed ? 'bg-[#E8FDF2] text-[#027A48]' : 'bg-[#FEE4E2] text-[#B42318]'}`}>
                      {verifyResult.passed ? '✓ PASSED! Debt cleared.' : '✗ Incorrect answer. Try again.'}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setActiveVerification(null)}>Close</Button>
                  <Button variant="primary" onClick={handleRunVerification} disabled={verifying || !verifyAnswer.trim()}>
                    {verifying ? 'Verifying...' : 'Submit Answer'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
