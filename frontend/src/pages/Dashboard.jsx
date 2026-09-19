import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentDebts } from '../services/api';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Metric from '../components/ui/Metric';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Timeline from '../components/ui/Timeline';
import { CardSkeleton } from '../components/SkeletonLoader';
import { 
  AlertCircle, 
  ArrowRight, 
  PlayCircle,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Clock
} from 'lucide-react';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const studentDebts = await getStudentDebts('std-101');
        setDebts(studentDebts || []);
      } catch (err) {
        console.error('Failed to load dashboard debts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeDebts = debts.filter(d => d.status !== 'REPAID' && d.status !== 'CLEAR');
  const repaidDebtsCount = debts.filter(d => d.status === 'REPAID').length + 7;
  const highPriorityCount = debts.filter(d => d.status === 'ESCALATED' || d.severity === 'HIGH' || d.severity === 'CRITICAL').length;
  
  const topNeedDebt = activeDebts.find(d => d.status === 'VERIFYING' || d.severity === 'HIGH' || d.status === 'ESCALATED') || activeDebts[0];

  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));
  allEvidence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getNextStepConfig = () => {
    if (!topNeedDebt) {
      return {
        title: 'All concepts verified mastered!',
        desc: 'No active Knowledge Debt requires intervention.',
        actionText: 'View Progress',
        route: '/progress'
      };
    }
    if (topNeedDebt.status === 'VERIFYING') {
      return {
        title: `Complete Verification Challenge for ${topNeedDebt.concept}`,
        desc: 'Verification challenge is active. Complete test to evaluate mastery.',
        actionText: 'Start Verification',
        route: '/student/std-101'
      };
    }
    if (topNeedDebt.status === 'MENTOR_REVIEW') {
      return {
        title: `Intervention for ${topNeedDebt.concept} is awaiting mentor review`,
        desc: 'AI strategy drafted and submitted to faculty mentor.',
        actionText: 'View Status',
        route: '/student/std-101'
      };
    }
    return {
      title: `Continue Intervention for ${topNeedDebt.concept}`,
      desc: 'Active strategy: Visual Trace & Memory Simulation.',
      actionText: 'Continue Strategy',
      route: '/interventions'
    };
  };

  const nextStep = getNextStepConfig();

  return (
    <AppLayout>
      <PageHeader
        category="Overview"
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Arun'}`}
        subtitle="Here is your learning health overview. Last assessment evaluated 2 hours ago."
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/student/std-101')} icon={ArrowRight} iconPosition="right">
            Ledger View
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Top Compact Hero & Metric Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* Knowledge Debt Score Tile */}
          <div className="md:col-span-1 p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 dark:from-slate-900 dark:to-slate-950 rounded-xl text-white text-center shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Knowledge Debt</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-0.5">75<span className="text-xs text-slate-400">/100</span></div>
            <div className="text-[10px] text-slate-300 mt-0.5">3 active gaps</div>
          </div>

          {/* 4 Metric Tiles */}
          <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Active Debt" value={activeDebts.length} icon={BookOpen} statusColor="amber" />
            <Metric label="Repaid Mastered" value={repaidDebtsCount} icon={CheckCircle2} statusColor="emerald" />
            <Metric label="High Priority" value={highPriorityCount || 1} icon={AlertCircle} statusColor="rose" />
            <Metric label="Mastery Progress" value="82%" icon={TrendingUp} statusColor="blue" trend="↑ 8%" trendDirection="down" />
          </div>
        </div>

        {/* Middle 2 Columns: Needs Attention (Left) & Your Next Step (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Needs Attention Table (2 Cols, max 5 rows) */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Needs Attention
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/std-101')}>
                View all →
              </Button>
            </div>

            {loading ? (
              <CardSkeleton />
            ) : (
              <Panel noPadding className="overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {activeDebts.slice(0, 5).map(debt => (
                    <div key={debt.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{debt.concept}</span>
                          <StatusBadge status={debt.severity} />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          State: <strong className="text-blue-600 dark:text-blue-400">{debt.status}</strong> • {debt.root_cause || 'Weakness logged.'}
                        </p>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => navigate('/student/std-101')}>
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* Your Next Step Focal Action Panel (1 Col) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Your Next Step
            </h3>

            <Panel className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{nextStep.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{nextStep.desc}</p>
              </div>

              {/* Embedded One-Line AI Recommendation Banner */}
              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">AI Proposes visual trace for Linked Lists · Evidence Decides</span>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate(nextStep.route)}
                icon={ArrowRight}
                iconPosition="right"
              >
                {nextStep.actionText}
              </Button>
            </Panel>
          </div>

        </div>

        {/* Bottom Stream: Recent Activity Timeline (max 5 items) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Recent Activity Stream
          </h3>

          <Panel>
            <Timeline 
              items={allEvidence} 
              maxItems={5} 
              onViewAll={() => navigate('/evidence')} 
            />
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
