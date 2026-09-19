import React, { useState } from 'react';
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

export default function MentorPanel({ reviewItem, onActionComplete }) {
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(reviewItem.generated_content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDecision = async (decision) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        decision, // 'approve' | 'edit' | 'reject'
        edited_content: decision === 'edit' ? editedContent : undefined
      };
      await submitMentorReview(reviewItem.intervention_id, payload);
      setIsEditModalOpen(false);
      showToast(`Intervention ${decision}d by Mentor successfully.`, 'success');
      if (onActionComplete) {
        onActionComplete(reviewItem.intervention_id, decision);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit mentor review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      
      {/* Top Header info */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300">
              Awaiting Mentor Approval
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Strategy Version {reviewItem.version || 1}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {reviewItem.concept} — {reviewItem.student_name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Proposed Strategy: <strong className="text-blue-600 dark:text-blue-400">{reviewItem.strategy}</strong>
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <div>Logged: {reviewItem.created_at}</div>
          <div className="text-amber-700 dark:text-amber-400 font-bold mt-0.5">{reviewItem.evidence_summary}</div>
        </div>
      </div>

      {/* AI Recommendation Content Draft */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          AI Drafted Remediation Content (Editable):
        </div>
        {reviewItem.generated_content}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 italic">
          Select mentor decision to update intervention lifecycle
        </span>

        <div className="flex items-center gap-2">
          {/* Reject */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDecision('reject')}
            disabled={isSubmitting}
            icon={XCircle}
          >
            Reject & Adapt
          </Button>

          {/* Edit */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={Edit3}
          >
            Edit Content
          </Button>

          {/* Approve */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDecision('approve')}
            disabled={isSubmitting}
            icon={CheckCircle}
          >
            Approve Intervention
          </Button>
        </div>
      </div>

      {/* Edit Content Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Human Mentor Content Editor
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Modify the AI-generated remediation text before approving it for student delivery.
            </p>

            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={8}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDecision('edit')}
                disabled={isSubmitting}
                icon={Send}
              >
                Save & Approve Edited Intervention
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
