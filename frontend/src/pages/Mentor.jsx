import React, { useState, useEffect } from 'react';
import { getPendingReviews } from '../services/api';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import MentorPanel from '../components/MentorPanel';
import { RefreshCw, CheckCircle2, Clock, ShieldCheck, Target } from 'lucide-react';

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
      <div className="space-y-6 max-w-[1120px] mx-auto pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] tracking-tight">
              Mentor Review Desk
            </h1>
            <p className="text-xs sm:text-sm text-[#5A6190] dark:text-[#94A3B8] font-semibold mt-1">
              Review and approve AI-generated lesson plans before they are delivered to students.
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={fetchQueue} icon={RefreshCw}>
            Refresh Queue
          </Button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF0C7] text-[#93370D] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                {pendingQueue.length}
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Pending reviews</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Awaiting teacher approval</span>
            </div>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D1FADF] text-[#05603A] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                12
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Plans approved</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Delivered to students</span>
            </div>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0EDFF] text-[#1849A9] flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                80%
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Pass standard</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Required for clearance</span>
            </div>
          </div>
        </div>

        {/* Queue Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#5A6190]">Loading review queue...</div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-12 rounded-[20px] bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 text-center space-y-2 shadow-soft">
              <CheckCircle2 className="w-10 h-10 text-[#12B76A] mx-auto" />
              <h3 className="text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">All Clear!</h3>
              <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold">
                No lesson plans currently require mentor approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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

      </div>
    </AppLayout>
  );
}

