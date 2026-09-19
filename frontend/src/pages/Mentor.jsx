import React, { useState, useEffect } from 'react';
import { getPendingReviews, submitMentorReview } from '../services/api';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Collapsible from '../components/ui/Collapsible';
import Timeline from '../components/ui/Timeline';
import { TableSkeleton, EmptyState } from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import { 
  CheckCircle, 
  Edit3, 
  XCircle, 
  Sparkles, 
  Send, 
  X,
  AlertTriangle,
  RefreshCw, 
  Inbox,
  UserCheck,
  FileSearch
} from 'lucide-react';

export default function Mentor() {
  const { showToast } = useToast();
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingReviews();
      const queue = data || [];
      setPendingQueue(queue);
      if (queue.length > 0 && !selectedId) {
        setSelectedId(queue[0].intervention_id);
        setEditedContent(queue[0].generated_content || '');
      }
    } catch (err) {
      setError('Unable to load pending mentor reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const selectedItem = pendingQueue.find(item => item.intervention_id === selectedId) || pendingQueue[0];

  const handleSelect = (item) => {
    setSelectedId(item.intervention_id);
    setEditedContent(item.generated_content || '');
  };

  const handleDecision = async (decision) => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        decision, // 'approve' | 'edit' | 'reject'
        edited_content: decision === 'edit' ? editedContent : undefined
      };
      await submitMentorReview(selectedItem.intervention_id, payload);
      setIsEditModalOpen(false);
      showToast(`Intervention ${decision}d by Mentor successfully.`, 'success');
      
      const updatedQueue = pendingQueue.filter(i => i.intervention_id !== selectedItem.intervention_id);
      setPendingQueue(updatedQueue);
      if (updatedQueue.length > 0) {
        setSelectedId(updatedQueue[0].intervention_id);
        setEditedContent(updatedQueue[0].generated_content || '');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit mentor review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        category="Mentor Desk"
        title="Human-in-the-Loop Mentor Review Queue"
        subtitle="Review, edit, approve, or reject AI-generated remediation proposals before student delivery."
        actions={
          <Button variant="secondary" size="sm" onClick={fetchQueue} icon={RefreshCw}>
            Refresh Queue
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center text-rose-800 dark:text-rose-300 font-bold text-xs space-y-2">
          <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
          <p>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchQueue}>Retry</Button>
        </div>
      ) : pendingQueue.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          description="No interventions currently require mentor review. All proposed AI remediation strategies have been processed."
          icon={CheckCircle}
        />
      ) : (
        /* Split Screen 2-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start text-xs">
          
          {/* Left Column (4 cols): Queue List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between pb-1">
              <span className="flex items-center gap-1.5">
                <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Review Queue ({pendingQueue.length})
              </span>
            </div>

            <Panel noPadding className="overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingQueue.map(item => {
                  const isSelected = selectedItem?.intervention_id === item.intervention_id;
                  return (
                    <div
                      key={item.intervention_id}
                      onClick={() => handleSelect(item)}
                      className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                        isSelected 
                          ? 'bg-blue-50/70 dark:bg-blue-950/50 border-l-4 border-blue-600 dark:border-blue-400 font-medium' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.student_name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.created_at}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.concept}</span>
                        <StatusBadge status={item.severity || 'HIGH'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Right Column (8 cols): Selected Proposal Details & Actions PINNED AT TOP */}
          <div className="lg:col-span-8 space-y-3">
            {selectedItem && (
              <Panel className="space-y-4">
                
                {/* Actions Bar PINNED AT TOP of the right panel */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{selectedItem.concept} — {selectedItem.student_name}</span>
                      <StatusBadge status="Awaiting Approval" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Strategy V{selectedItem.version || 1}: <strong className="text-blue-600 dark:text-blue-400">{selectedItem.strategy}</strong>
                    </div>
                  </div>

                  {/* Pinned Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
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
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditedContent(selectedItem.generated_content || '');
                        setIsEditModalOpen(true);
                      }}
                      icon={Edit3}
                    >
                      Edit Content
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDecision('approve')}
                      disabled={isSubmitting}
                      icon={CheckCircle}
                    >
                      Approve Strategy
                    </Button>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* AI Draft Content Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    AI Drafted Remediation Content (Editable):
                  </div>
                  {selectedItem.generated_content}
                </div>

                {/* Supporting Evidence in Collapsible below actions */}
                <Collapsible title="supporting evidence signals" icon={FileSearch}>
                  <div className="p-3 rounded-lg bg-slate-100/60 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Evidence Summary:</div>
                    <p>{selectedItem.evidence_summary || 'Logged 3 incorrect quiz answers below mastery threshold.'}</p>
                  </div>
                </Collapsible>

              </Panel>
            )}
          </div>

        </div>
      )}

      {/* Edit Content Modal Overlay */}
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
    </AppLayout>
  );
}
