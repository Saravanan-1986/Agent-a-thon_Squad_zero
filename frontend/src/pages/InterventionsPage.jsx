import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import InterventionCard from '../components/InterventionCard';
import { getStudentDebts } from '../services/api';
import { Sparkles, RefreshCw, Cpu, Layers, BookOpen } from 'lucide-react';

export default function InterventionsPage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const d = await getStudentDebts(selectedStudentId || '1');
      setDebts(d || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [selectedStudentId]);

  const activeInterventions = debts.filter(d => d.interventions && d.interventions.length > 0);

  const filteredDebts = activeInterventions.filter(d => {
    if (filterMode === 'adapted') {
      return d.interventions?.some(i => (i.version || 1) > 1);
    }
    if (filterMode === 'mentor') {
      return d.interventions?.some(i => i.mentor_status === 'APPROVED');
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] tracking-tight">
              Fixes & Lesson Plans
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6788] dark:text-[#94A3B8] font-medium mt-1">
              Personalized AI lesson strategies. If a check-up quiz score is under 80%, the AI adapts to teach the topic using visual memory tools (V1 &rarr; V2).
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={fetchDebts} icon={RefreshCw}>
            Refresh Lessons
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-bold">
          {[
            { id: 'all', label: 'All Lesson Plans' },
            { id: 'adapted', label: 'Adapted V2 Strategies' },
            { id: 'mentor', label: 'Mentor Approved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-[#5B4BFF] text-white'
                  : 'bg-white dark:bg-[#22295E] text-[#5F6788] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lesson Cards List */}
        <div className="space-y-6">
          {filteredDebts.length === 0 ? (
            <div className="p-12 rounded-[20px] bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 text-center text-xs text-[#5F6788]">
              No active lesson plans match this filter.
            </div>
          ) : (
            filteredDebts.map((d) => (
              <div key={d.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1B2150] dark:text-[#F1F5F9]">
                    {d.concept}
                  </h3>
                  <StatusBadge status={d.status} />
                </div>

                <div className="space-y-4">
                  {d.interventions.map((intItem) => (
                    <InterventionCard key={intItem.id} intervention={intItem} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </AppLayout>
  );
}
