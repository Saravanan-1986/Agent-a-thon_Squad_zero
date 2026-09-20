import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Edit3, 
  XCircle, 
  Sparkles, 
  Send, 
  X,
  AlertTriangle
} from 'lucide-react';
import { submitMentorReview } from '../services/api';
import { useToast } from './Toast';
import Button from './ui/Button';
import MarkdownRenderer from './ui/MarkdownRenderer';

export default function MentorPanel({ reviewItem, onActionComplete }) {
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(
    typeof reviewItem.generated_content === 'object'
      ? JSON.stringify(reviewItem.generated_content, null, 2)
      : (reviewItem.generated_content || '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDecision = async (decision) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        decision,
        edited_content: decision === 'edit' ? editedContent : undefined
      };
      await submitMentorReview(reviewItem.intervention_id, payload);
      setIsEditModalOpen(false);
      showToast(`Intervention ${decision}d by mentor successfully.`, 'success');
      if (onActionComplete) {
        onActionComplete(reviewItem.intervention_id, decision);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit mentor review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawContent = reviewItem.generated_content;
  const contentText = typeof rawContent === 'object' && rawContent !== null
    ? (rawContent.concept_explanation || rawContent.core_explanation || JSON.stringify(rawContent, null, 2))
    : String(rawContent || 'No draft content.');

  return (
    <div className="p-6 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
        <div>
          <span className="text-xs font-bold text-[#FF6A2B] block">
            Awaiting Mentor Check
          </span>
          <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
            {reviewItem.concept} — {reviewItem.student_name}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDecision('reject')}
            disabled={isSubmitting}
            icon={XCircle}
          >
            Reject
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={Edit3}
          >
            Edit
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDecision('approve')}
            disabled={isSubmitting}
            icon={CheckCircle}
          >
            Approve
          </Button>
        </div>
      </div>

      {/* Lesson Content Preview */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10">
        <MarkdownRenderer content={contentText} />
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#FEE4E2] text-[#B42318] text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Edit Content Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-[#1A204C] rounded-[20px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                  Edit Lesson Plan Before Approval
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-[#8C94B2]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#22295E] text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => handleDecision('edit')} disabled={isSubmitting}>
                  Save & Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
