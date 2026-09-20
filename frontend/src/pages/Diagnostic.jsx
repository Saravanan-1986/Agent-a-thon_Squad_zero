import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import { startDSADiagnostic, submitDSADiagnostic, submitVerification, startAdaptiveDiagnostic, getNextAdaptiveQuestion, submitAdaptiveAnswer } from '../services/api';
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
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function Diagnostic() {
  const navigate = useNavigate();

  // Diagnostic Test State
  const [loading, setLoading] = useState(true);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [topicQuestionsAnswered, setTopicQuestionsAnswered] = useState(0);
  const [totalTopicQuestions, setTotalTopicQuestions] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [timer, setTimer] = useState(0);

  // Result / History State
  const [result, setResult] = useState(null);
  const [topicHistory, setTopicHistory] = useState([]);

  // Verification Modal State
  const [activeVerification, setActiveVerification] = useState(null);
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const studentId = 1;

  // Timer tick
  useEffect(() => {
    let interval;
    if (attemptInfo && !result) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [attemptInfo, result]);

  const loadQuestionForTopic = async (attemptId, conceptId = null) => {
    setLoading(true);
    try {
      const data = await getNextAdaptiveQuestion(attemptId, studentId, conceptId);
      setCurrentTopic(data.concept);
      setCurrentQuestion(data.question);
      setTopicQuestionsAnswered(data.topic_questions_answered || 0);
      setTotalTopicQuestions(data.total_topic_questions || 10);
      setSelectedAnswer(null);
      setLastFeedback(null);
    } catch (err) {
      console.error('Failed to load adaptive question:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load diagnostic attempt on mount
  useEffect(() => {
    async function initDiagnostic() {
      setLoading(true);
      try {
        const startData = await startAdaptiveDiagnostic(studentId, 'DSA');
        setAttemptInfo(startData);
        setCurrentTopic(startData.target_concept);
        await loadQuestionForTopic(startData.attempt_id, startData.target_concept?.id);
      } catch (err) {
        console.error('Failed to start adaptive diagnostic:', err);
      } finally {
        setLoading(false);
      }
    }
    initDiagnostic();
  }, []);

  const handleSelectAnswer = (optionVal) => {
    setSelectedAnswer(optionVal);
  };

  const handleNextAdaptiveSubmit = async () => {
    if (!attemptInfo || !currentQuestion || selectedAnswer === null) return;
    setSubmitting(true);
    try {
      const res = await submitAdaptiveAnswer(
        attemptInfo.attempt_id,
        studentId,
        currentQuestion.id,
        selectedAnswer,
        30.0
      );
      setLastFeedback(res);

      setTopicHistory(prev => [
        ...prev,
        {
          concept: currentTopic,
          question: currentQuestion,
          selected_answer: selectedAnswer,
          is_correct: res.is_correct,
          status: res.status,
          debt_created: res.debt_created,
          explanation: res.explanation
        }
      ]);

      if (res.next_concept) {
        await loadQuestionForTopic(attemptInfo.attempt_id, res.next_concept.id);
      } else {
        setResult({
          overall_score: res.is_correct ? 100 : 50,
          completed: true,
          summary: res.message || 'Diagnostic assessment completed successfully!'
        });
      }
    } catch (err) {
      console.error('Adaptive answer submit error:', err);
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
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">Loading 10 MCQ questions across key DSA topics.</p>
        </div>
      </AppLayout>
    );
  }

  // SCREEN 1: TAKING TOPIC ADAPTIVE DIAGNOSTIC ASSESSMENT
  if (!result && currentQuestion) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          
          {/* Active Topic Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[20px] bg-gradient-to-r from-[#2F2A8C] via-[#5B4BFF] to-[#7A6BFF] text-white shadow-soft">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Current Topic: {currentTopic?.category || 'DSA'}</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {currentTopic?.name || 'Array Traversal'}
              </h1>
              <p className="text-xs text-[#E4E1FF] font-medium mt-0.5">
                Topic-by-Topic Adaptive Assessment (10 MCQ Quiz per Module). Solve each topic to progress.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
                <Clock className="w-4 h-4" />
                <span>Timer: {formatTimer(timer)}</span>
              </div>
            </div>
          </div>

          {/* 10 MCQ Progress Tracker */}
          <div className="p-4 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#EEECFF] dark:bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-[#818CF8] font-extrabold text-xs">
                  Question {topicQuestionsAnswered + 1} of 10
                </span>
                <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                  {currentTopic?.name} MCQ Quiz
                </span>
              </div>
              <span className="text-xs font-extrabold text-[#5B4BFF]">
                {Math.round(((topicQuestionsAnswered + 1) / 10) * 100)}% Topic Progress
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#5B4BFF] to-[#7A6BFF] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, ((topicQuestionsAnswered + 1) / 10) * 100))}%` }}
              />
            </div>

            <div className="grid grid-cols-10 gap-1.5 pt-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isCompleted = idx < topicQuestionsAnswered;
                const isCurrent = idx === topicQuestionsAnswered;
                return (
                  <div
                    key={idx}
                    className={`h-2.5 rounded-full text-center text-[10px] font-extrabold transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'bg-[#5B4BFF] text-white ring-2 ring-[#5B4BFF]/40 animate-pulse'
                        : isCompleted
                        ? 'bg-[#12B76A] text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                    title={`Question ${idx + 1} of 10`}
                  />
                );
              })}
            </div>
          </div>

          {/* Immediate Feedback Banner */}
          {lastFeedback && (
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              lastFeedback.is_correct
                ? 'bg-[#ECFDF3] border-[#12B76A] text-[#027A48]'
                : 'bg-[#FEF3F2] border-[#F04438] text-[#B42318]'
            }`}>
              {lastFeedback.is_correct ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#12B76A]" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#F04438]" />
              )}
              <div className="text-xs space-y-1">
                <span className="font-extrabold text-sm block">
                  {lastFeedback.is_correct ? 'Correct Answer Recorded!' : 'Knowledge Gap Signal Logged'}
                </span>
                <p className="leading-relaxed">
                  {lastFeedback.is_correct
                    ? `Evidence recorded in database. Continuing topic quiz (Question ${topicQuestionsAnswered + 1} of 10).`
                    : `Knowledge Gap Probability: ${(lastFeedback.knowledge_gap_probability * 100).toFixed(0)}%. Deterministic debt registered in DB.`}
                </p>
                {lastFeedback.explanation && (
                  <div className="mt-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-[11px]">
                    <strong>Explanation:</strong> {lastFeedback.explanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-6">
            
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#818CF8]">
                  Topic Question {topicQuestionsAnswered + 1} of 10 — {currentTopic?.name}
                </span>
                {currentQuestion.source_reference && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E0EDFF] text-[#1849A9] dark:bg-[#1E295B] dark:text-[#93C5FD] font-extrabold text-[11px]">
                    Source: {currentQuestion.source_reference}
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold text-[#8C94B2] flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Difficulty: {currentQuestion.difficulty_label || 'medium'}
              </span>
            </div>

            {/* Question Text */}
            <div>
              <MarkdownRenderer content={currentQuestion.question_text} className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]" />
            </div>

            {/* Selectable MCQ Options */}
            <div className="space-y-3 pt-2">
              {(() => {
                const opts = (currentQuestion.options && currentQuestion.options.length > 0)
                  ? currentQuestion.options
                  : ['Option A', 'Option B', 'Option C', 'Option D'];

                return opts.map((opt, oIdx) => {
                  const optKey = typeof opt === 'object' ? opt.key || opt.text : opt;
                  const optText = typeof opt === 'object' ? opt.text : opt;
                  const isSelected = selectedAnswer === optKey || selectedAnswer === optText;
                  const letter = String.fromCharCode(65 + oIdx);

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(optKey)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#EEECFF] dark:bg-[#5B4BFF]/20 border-[#5B4BFF] text-[#1B2150] dark:text-white shadow-soft font-semibold ring-2 ring-[#5B4BFF]/30'
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
                });
              })()}
            </div>

            {/* Submit & Next Question Button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-200/80 dark:border-white/10">
              <Button
                variant="primary"
                size="md"
                onClick={handleNextAdaptiveSubmit}
                disabled={submitting || selectedAnswer === null}
                icon={CheckCircle2}
              >
                {submitting ? 'Evaluating & Logging Evidence...' : `Submit Answer (${topicQuestionsAnswered + 1}/10)`}
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
            Click below to start or refresh your diagnostic 10 MCQ module assessment.
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
            <span>Diagnostic Module Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Your Overall Score: {result?.overall_score ?? 0}%
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            You completed 10 MCQ questions for the topic assessment.
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
                  <p className="text-[#1B2150] dark:text-[#F1F5F9] font-bold">
                    Check-up Question: In C++, if `int x = 42; int* p = &x;`, what does `*p` evaluate to?
                  </p>

                  <div className="space-y-2">
                    {[
                      '42',
                      'The memory address of variable x',
                      '0 (Null pointer)',
                      'Size in bytes of integer'
                    ].map((vOpt, vIdx) => (
                      <button
                        key={vIdx}
                        onClick={() => setVerifyAnswer(vOpt)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 text-xs font-semibold cursor-pointer ${
                          verifyAnswer === vOpt
                            ? 'bg-[#EEECFF] dark:bg-[#5B4BFF]/20 border-[#5B4BFF] text-[#5B4BFF]'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          verifyAnswer === vOpt ? 'bg-[#5B4BFF] text-white' : 'border border-slate-300 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + vIdx)}
                        </div>
                        <span>{vOpt}</span>
                      </button>
                    ))}
                  </div>

                  {verifyResult && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${verifyResult.passed ? 'bg-[#E8FDF2] text-[#027A48]' : 'bg-[#FEE4E2] text-[#B42318]'}`}>
                      {verifyResult.passed ? '✓ PASSED! Knowledge debt successfully repaid.' : '✗ Incorrect answer. Review lesson strategy and retry.'}
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

