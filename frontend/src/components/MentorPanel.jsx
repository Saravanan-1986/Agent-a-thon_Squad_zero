import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Edit3, 
  XCircle, 
  Sparkles, 
  Send, 
  X,
  AlertTriangle,
  FileText,
  User,
  Activity
} from 'lucide-react';
import { submitMentorReview } from '../services/api';
import { useToast } from './Toast';
import Button from './ui/Button';

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

  const rawContent = reviewItem.generated_content;
  const contentText = typeof rawContent === 'object' && rawContent !== null
    ? (rawContent.concept_explanation || rawContent.core_explanation || JSON.stringify(rawContent, null, 2))
    : String(rawContent || 'No draft content.');

  return (
    <div className="bg-obsidian-850/90 rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4 backdrop-blur-md relative overflow-hidden">
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyber-400 to-indigo-500" />

      {/* Top Header info */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Awaiting Faculty Approval
            </span>
            <span className="text-xs font-mono text-slate-400">
              Strategy Version {reviewItem.version || 1}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-display text-white mt-1">
            {reviewItem.concept} <span className="text-slate-500 font-normal">—</span> <span className="text-cyber-300">{reviewItem.student_name}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Strategy Category: <strong className="text-cyber-400 font-mono">{reviewItem.strategy}</strong>
          </p>
        </div>

        <div className="text-right text-xs font-mono text-slate-400">
          <div>Logged: <span className="text-slate-300">{reviewItem.created_at || 'Just now'}</span></div>
          {reviewItem.evidence_summary && (
            <div className="text-amber-400 font-semibold mt-0.5">{reviewItem.evidence_summary}</div>
          )}
        </div>
      </div>

      {/* AI Recommendation Content Draft */}
      <div className="p-4 rounded-xl bg-obsidian-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans space-y-2">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyber-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyber-400" />
            <span>AI Drafted Remediation Content (Subject to Mentor Calibrations):</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono lowercase">editable buffer</span>
        </div>
        <div className="whitespace-pre-line text-slate-300 pl-2 border-l-2 border-slate-800">
          {contentText}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-xs text-slate-500 italic">
          Decision directly updates student intervention lifecycle
        </span>

        <div className="flex items-center gap-2.5">
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
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-obsidian-980/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-obsidian-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-700 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  Faculty Content Calibrator
                </h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-obsidian-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Modify or annotate the AI-generated remediation text before officially approving it for delivery to {reviewItem.student_name}.
              </p>

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={9}
                className="w-full p-4 bg-obsidian-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyber-400 leading-relaxed shadow-inner"
              />

              <div className="flex justify-end gap-2.5 pt-2">
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
                  Save & Approve Intervention
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
