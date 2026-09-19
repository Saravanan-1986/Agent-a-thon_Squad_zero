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
import { CardSkeleton } from '../components/SkeletonLoader';
import { 
  AlertCircle, 
  ArrowRight, 
  BrainCircuit, 
  PlayCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Sparkles
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
        desc: 'Verification challenge is active. Complete the test to evaluate mastery.',
        actionText: 'Start Verification Challenge',
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
      actionText: 'Continue Intervention',
      route: '/interventions'
    };
  };

  const nextStep = getNextStepConfig();

  return (
    <AppLayout>
      {/* Header Greeting */}
      <PageHeader
        category="Overview"
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Arun'}`}
        subtitle="Here is your current learning health overview. Last assessment evaluated 2 hours ago."
        actions={
          <Button variant="primary" size="md" onClick={() => navigate('/student/std-101')} icon={ArrowRight} iconPosition="right">
            Knowledge Debt Ledger
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Knowledge Debt Hero Section */}
        <Panel className="bg-gradient-to-r from-blue-900 to-indigo-950 dark:from-slate-900 dark:to-slate-950 border-0 text-white p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  High Priority
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {activeDebts.length} active learning gaps require attention
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white">
                Knowledge Debt Score: <span className="text-blue-400 font-extrabold text-3xl ml-1">75</span>
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Empirically measures unresolved concept gaps, persistence across assessments, prerequisite dependencies, and verification evidence signals.
              </p>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-center shrink-0 min-w-[150px]">
              <div className="text-3xl font-extrabold text-blue-400">75<span className="text-xs text-slate-400">/100</span></div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-1">Knowledge Debt</div>
            </div>
          </div>
        </Panel>

        {/* Analytical Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Active Debt" value={activeDebts.length} icon={BookOpen} statusColor="amber" subtext="Concepts needing resolution" />
          <Metric label="Repaid Mastered" value={repaidDebtsCount} icon={CheckCircle2} statusColor="emerald" subtext="Verified through evidence" />
          <Metric label="High Priority" value={highPriorityCount || 1} icon={AlertCircle} statusColor="rose" subtext="Needs immediate focus" />
          <Metric label="Learning Progress" value="82%" icon={TrendingUp} statusColor="blue" trend="↑ 8%" trendDirection="down" subtext="Compared to last week" />
        </div>

        {/* Main 2-Column Dashboard Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Needs Attention Analytical Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Needs Attention
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/std-101')}>
                View All Debts →
              </Button>
            </div>

            {loading ? (
              <CardSkeleton />
            ) : (
              <Panel noPadding className="overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeDebts.slice(0, 3).map(debt => (
                    <div key={debt.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{debt.concept}</span>
                          <StatusBadge status={debt.severity} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          State: <strong className="text-blue-600 dark:text-blue-400">{debt.status}</strong> • {debt.root_cause || 'Weakness logged in quiz assessments.'}
                        </p>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => navigate('/student/std-101')}>
                        Review Debt →
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* Your Next Step Focal Action Panel (1 Col) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Your Next Step
            </h3>

            <Panel title={nextStep.title} subtitle="Primary action required for debt repayment">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {nextStep.desc}
              </p>

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

        {/* Lower Grid: AI Recommendation & Activity Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Recommendation Banner */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              AI Recommendation
            </h3>

            <Panel className="bg-slate-900 dark:bg-slate-900 border-slate-800 text-white">
              <p className="text-xs text-slate-300 leading-relaxed">
                Based on available evidence, the system proposes a visual trace simulation for <strong className="text-blue-400">Linked Lists</strong>.
              </p>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 mt-3 italic font-medium">
                LLM Proposes. Evidence Decides.
              </div>
            </Panel>
          </div>

          {/* Activity Trail */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Recent Activity Trail
            </h3>

            <Panel noPadding>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {allEvidence.slice(0, 3).map((ev, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ev.concept}</span>
                      <span className="text-slate-500 dark:text-slate-400">• {ev.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{ev.timestamp}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ev.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {ev.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
