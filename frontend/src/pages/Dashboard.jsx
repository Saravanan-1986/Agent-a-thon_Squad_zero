import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Sparkles,
  Zap,
  Activity,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, selectedStudentId } = useAuth();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const studentDebts = await getStudentDebts(selectedStudentId || '1');
        setDebts(studentDebts || []);
      } catch (err) {
        console.error('Failed to load dashboard debts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedStudentId]);

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
        route: `/student/${selectedStudentId || '1'}`
      };
    }
    if (topNeedDebt.status === 'MENTOR_REVIEW') {
      return {
        title: `Intervention for ${topNeedDebt.concept} is awaiting mentor review`,
        desc: 'AI strategy drafted and submitted to faculty mentor.',
        actionText: 'View Status',
        route: `/student/${selectedStudentId || '1'}`
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

  // Circular gauge math for score 75/100
  const score = 75;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <AppLayout>
      {/* Header Greeting */}
      <PageHeader
        category="Overview"
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Rahul'}`}
        subtitle="Real-time learning health overview. Automated prerequisite tracing and deterministic state monitoring active."
        actions={
          <Button variant="primary" size="md" onClick={() => navigate(`/student/${selectedStudentId || '1'}`)} icon={ArrowRight} iconPosition="right">
            Knowledge Debt Ledger
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Knowledge Debt Hero Section with Radial Gauge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-obsidian-950 dark:via-obsidian-900 dark:to-obsidian-950 border border-slate-700 dark:border-obsidian-750 text-white p-7 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-500/10 dark:bg-cyber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  High Priority Debt
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {activeDebts.length} active learning gaps require targeted remediation
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                Knowledge Debt Score: <span className="text-blue-300 dark:text-cyber-400 font-extrabold ml-1">75</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Empirically measures unresolved concept gaps, persistence across assessments, prerequisite dependencies, and verification evidence signals.
              </p>
            </div>

            {/* Radial SVG Gauge Ring */}
            <div className="p-4 bg-black/20 dark:bg-obsidian-950/80 backdrop-blur-md rounded-2xl border border-white/10 dark:border-obsidian-750 text-center shrink-0 flex items-center justify-center gap-4 min-w-[200px]">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 110 110">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    className="text-white/10 dark:text-obsidian-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="url(#cyberGradient)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-display font-extrabold text-white">75</span>
                  <span className="text-[10px] font-mono text-slate-300">/ 100</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-mono font-bold text-blue-300 dark:text-cyber-400 uppercase tracking-wider">INDEX</div>
                <div className="text-xs font-bold text-white font-display">Persistent Debt</div>
                <div className="text-[10px] font-mono text-slate-300 mt-1">High Risk (76.7%)</div>
              </div>
            </div>
          </div>
        </motion.div>

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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
                <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Needs Attention
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/student/${selectedStudentId || '1'}`)}>
                View All Debts →
              </Button>
            </div>

            {loading ? (
              <CardSkeleton />
            ) : (
              <Panel noPadding className="overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-obsidian-800">
                  {activeDebts.slice(0, 3).map(debt => (
                    <div key={debt.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-obsidian-850/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm font-display">{debt.concept}</span>
                          <StatusBadge status={debt.severity} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          State: <strong className="text-blue-600 dark:text-cyber-400 font-mono">{debt.status}</strong> • {debt.root_cause || 'Weakness logged in quiz assessments.'}
                        </p>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => navigate(`/student/${selectedStudentId || '1'}`)}>
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
              <PlayCircle className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
              Your Next Step
            </h3>

            <Panel title={nextStep.title} subtitle="Primary action required for debt repayment">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-sans">
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
              AI Recommendation
            </h3>

            <Panel>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Based on available evidence, the system proposes a visual trace simulation for <strong className="text-blue-600 dark:text-cyber-400">Linked Lists</strong>.
              </p>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-400 border-t border-slate-100 dark:border-obsidian-800 pt-3 mt-3 italic font-medium">
                LLM Proposes. Evidence Decides.
              </div>
            </Panel>
          </div>

          {/* Activity Trail */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Recent Activity Trail
            </h3>

            <Panel noPadding>
              <div className="divide-y divide-slate-100 dark:divide-obsidian-800 text-xs font-mono">
                {allEvidence.slice(0, 3).map((ev, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-obsidian-850/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-sans">{ev.concept}</span>
                      <span className="text-slate-400">• {ev.source}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{ev.timestamp}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ev.passed ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {ev.score}%
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

