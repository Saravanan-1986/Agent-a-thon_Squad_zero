import React, { useState, useEffect } from 'react';
import { getPendingReviews } from '../services/api';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import MentorPanel from '../components/MentorPanel';
import { TableSkeleton, EmptyState } from '../components/SkeletonLoader';
import { CheckCircle2, ShieldAlert, RefreshCw, Inbox } from 'lucide-react';

export default function Mentor() {
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingReviews();
      setPendingQueue(data || []);
    } catch (err) {
      setError('Unable to load pending mentor reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleActionComplete = (interventionId, decision) => {
    setPendingQueue(prev => prev.filter(item => item.intervention_id !== interventionId));
  };

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        category="Mentor Desk"
        title="Human-in-the-Loop Mentor Review Queue"
        subtitle="Review, edit, approve, or reject AI-generated remediation proposals before delivery to students."
        actions={
          <Button variant="secondary" size="sm" onClick={fetchQueue} icon={RefreshCw}>
            Refresh Queue
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Queue items */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center text-rose-800 dark:text-rose-300 font-bold text-xs space-y-2">
            <ShieldAlert className="w-6 h-6 text-rose-500 mx-auto" />
            <p>{error}</p>
            <Button variant="danger" size="sm" onClick={fetchQueue}>
              Retry
            </Button>
          </div>
        ) : pendingQueue.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            description="No interventions currently require mentor review. All proposed AI remediation strategies have been processed."
            icon={CheckCircle2}
          />
        ) : (
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Pending Reviews Queue ({pendingQueue.length})
            </div>

            {pendingQueue.map((item) => (
              <MentorPanel
                key={item.intervention_id}
                reviewItem={item}
                onActionComplete={handleActionComplete}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
