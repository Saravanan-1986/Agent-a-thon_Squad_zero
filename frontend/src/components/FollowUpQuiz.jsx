import React, { useState } from 'react';
import { HelpCircle, Send, ShieldCheck } from 'lucide-react';
import { submitVerification } from '../services/api';
import Button from './ui/Button';

export default function FollowUpQuiz({ debtId, question, onResult }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!question) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        question_id: question.id,
        answer: selectedOption
      };
      const res = await submitVerification(debtId, payload);
      if (onResult) {
        onResult(res);
      }
    } catch (err) {
      setError(err.message || 'Verification submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Assessment Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800/80 pb-2">
        <span className="flex items-center gap-1.5 font-bold">
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Verification Question 1 of 1
        </span>
        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[10px] uppercase font-bold">
          REQUIRED FOR REPAYMENT
        </span>
      </div>

      <div className="text-xs text-slate-800 dark:text-slate-200 space-y-2.5">
        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed">
          {question.question}
        </p>

        <div className="grid grid-cols-1 gap-2 pt-0.5">
          {question.options?.map((opt, idx) => {
            const letter = opt.charAt(0);
            const isChecked = selectedOption === letter;

            return (
              <label
                key={idx}
                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 font-semibold ring-1 ring-blue-500 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name={`quiz-${question.id}`}
                  value={letter}
                  checked={isChecked}
                  onChange={() => setSelectedOption(letter)}
                  className="text-blue-600 focus:ring-blue-500 accent-blue-600 shrink-0"
                />
                <span className="text-xs select-none">{opt}</span>
              </label>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Strict evidence evaluation (No manual override)
        </span>

        <Button
          type="submit"
          disabled={!selectedOption || isSubmitting}
          variant="primary"
          size="sm"
          icon={Send}
        >
          {isSubmitting ? 'Evaluating Evidence...' : 'Submit Verification Answer'}
        </Button>
      </div>
    </form>
  );
}
