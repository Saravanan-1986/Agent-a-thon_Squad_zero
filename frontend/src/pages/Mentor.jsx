import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPendingReviews } from '../services/api';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import MentorPanel from '../components/MentorPanel';
import { TableSkeleton, EmptyState } from '../components/SkeletonLoader';
import { CheckCircle2, ShieldAlert, RefreshCw, Inbox, UserCheck, ShieldCheck, Clock } from 'lucide-react';

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
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          category="Faculty Oversight"
          title="Human-in-the-Loop Review Desk"
          subtitle="Authorize, calibrate, or reject AI remediation proposals. Pedagogical AI proposes — accredited educators decide."
          actions={
            <Button variant="secondary" size="sm" onClick={fetchQueue} icon={RefreshCw}>
              Refresh Queue
            </Button>
          }
        />

        {/* Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-obsidian-850/80 border border-slate-700/60 relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Queue Items Awaiting Review</p>
                <h4 className="text-2xl font-black font-display text-white mt-0.5">{pendingQueue.length}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Prioritized by severity & risk</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-obsidian-850/80 border border-slate-700/60 relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Faculty Authority</p>
                <h4 className="text-2xl font-black font-display text-white mt-0.5">Active</h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">Dr. Elena Vance (Lead Mentor)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-obsidian-850/80 border border-slate-700/60 relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-400">Safety Verification</p>
                <h4 className="text-2xl font-black font-display text-white mt-0.5">Adversarial Safe</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero student self-approvals</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyber-500/10 border border-cyber-500/30 flex items-center justify-center text-cyber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Queue Content */}
        <div className="space-y-4">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-center text-rose-300 font-bold text-xs space-y-3">
              <ShieldAlert className="w-6 h-6 text-rose-500 mx-auto" />
              <p>{error}</p>
              <Button variant="danger" size="sm" onClick={fetchQueue}>
                Retry Loading
              </Button>
            </div>
          ) : pendingQueue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-2xl bg-obsidian-900/80 border border-slate-800 text-center space-y-3 backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-white">Queue Clear — All Proposals Processed</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No interventions currently require mentor authorization. All pending AI remediation plans have been reviewed and forwarded to student dashboards.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-cyber-400" />
                Pending Verification Proposals ({pendingQueue.length})
              </div>

              <AnimatePresence>
                {pendingQueue.map((item) => (
                  <motion.div
                    key={item.intervention_id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <MentorPanel
                      reviewItem={item}
                      onActionComplete={handleActionComplete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
