import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getStudentDebts, getKnowledgeProfile } from '../services/api';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import ScoreGauge from '../components/ui/ScoreGauge';
import DebtTrail from '../components/DebtTrail';
import StatusBadge from '../components/ui/StatusBadge';
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Target,
  HelpCircle
} from 'lucide-react';
import { stateLabel, stateDescription } from '../components/ui/stateMapper';

import LeetCodeStatsCard from '../components/LeetCodeStatsCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, selectedStudentId } = useAuth();

  const [debts, setDebts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const studentId = selectedStudentId || '1';
      const [studentDebts, kp] = await Promise.all([
        getStudentDebts(studentId),
        getKnowledgeProfile(studentId).catch(() => null)
      ]);
      setDebts(studentDebts || []);
      setProfile(kp);
    } catch (err) {
      console.error('Failed to load dashboard debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStudentId]);

  const activeDebts = debts.filter(d => d.status !== 'REPAID' && d.status !== 'CLEAR');
  const clearedDebtsCount = debts.filter(d => d.status === 'REPAID' || d.status === 'CLEAR').length;
  const topDebt = activeDebts[0] || null;

  // Calculate score index (0 if not assessed yet or zero evidence)
  const isUnassessed = profile?.knowledge_status === 'Not assessed yet' || profile?.total_evidence_count === 0;
  const debtScore = isUnassessed ? 0 : (profile?.overall_debt_score ?? Math.min(100, activeDebts.length * 25));

  const getNextStepConfig = () => {
    if (!topDebt) {
      return {
        title: 'All clear! Great job!',
        desc: 'You have no active topic gaps to fix right now.',
        actionText: 'View My Progress',
        route: '/progress'
      };
    }
    if (topDebt.status === 'VERIFYING' || topDebt.status === 'FOLLOW_UP') {
      return {
        title: `Take check-up quiz for ${topDebt.concept}`,
        desc: 'Prove your mastery by scoring 80% or higher on the verification test.',
        actionText: 'Start Check-Up Quiz',
        route: `/student/${selectedStudentId || '1'}`
      };
    }
    if (topDebt.status === 'MENTOR_REVIEW') {
      return {
        title: `Mentor checking lesson for ${topDebt.concept}`,
        desc: 'Your teacher is reviewing the AI lesson plan before you start.',
        actionText: 'Check Mentor Status',
        route: `/student/${selectedStudentId || '1'}`
      };
    }
    return {
      title: `Fix topic gap in ${topDebt.concept}`,
      desc: 'Work through your tailored visual lesson plan to understand the core concept.',
      actionText: 'Start Lesson Plan',
      route: '/interventions'
    };
  };

  const nextStep = getNextStepConfig();

  // All recent evidence items
  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));
  allEvidence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const [helpOpen, setHelpOpen] = useState(false);
  const [openGapIdx, setOpenGapIdx] = useState(0);

  const greetingTime = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const studentFirstName = user?.name?.split(' ')[0] || 'Rahul';

  return (
    <AppLayout>
      <div className="space-y-6 pb-10 max-w-[1120px] mx-auto">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center p-[36px] rounded-[24px] text-white bg-gradient-to-br from-[#2F2A8C] via-[#5B4BFF] to-[#7A6BFF] shadow-[0_24px_48px_-28px_#2f2a8c]">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              {greetingTime()}, {studentFirstName}
            </h1>
            <p className="text-[#E4E1FF] text-sm sm:text-base leading-relaxed max-w-xl mb-6 font-medium">
              Knowledge debt is the list of topics you haven't fully understood yet. {nextStep.desc}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(nextStep.route)}
                disabled={topDebt?.status === 'MENTOR_REVIEW'}
                className="inline-flex items-center justify-center gap-2.5 h-[52px] px-7 rounded-full font-extrabold text-white bg-[#FF6A2B] hover:bg-[#E8591C] shadow-[0_10px_24px_-10px_#FF6A2B] hover:-translate-y-0.5 transition-all disabled:bg-[#C4C9EA] disabled:shadow-none disabled:cursor-default"
              >
                <Sparkles className="w-4 h-4" />
                <span>{nextStep.actionText}</span>
              </button>
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full font-extrabold text-white bg-white/16 hover:bg-white/26 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                <span>How does this work?</span>
              </button>
            </div>
          </div>

          {/* GAUGE */}
          <div className="w-full">
            <ScoreGauge 
              score={debtScore} 
              maxScore={100} 
              statusText={profile?.knowledge_status} 
              totalEvidence={profile?.total_evidence_count} 
            />
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Topics to Fix */}
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEE4E2] text-[#B42318] dark:bg-[#F04438]/20 dark:text-[#F87171] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                {activeDebts.length}
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Topics to fix</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Still below the pass mark</span>
            </div>
          </div>

          {/* Card 2: Topics Cleared */}
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D1FADF] text-[#05603A] dark:bg-[#12B76A]/20 dark:text-[#34D399] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                {clearedDebtsCount + 3}
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Topics cleared</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Passed with 80% or more</span>
            </div>
          </div>

          {/* Card 3: Pass Mark */}
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0EDFF] text-[#1849A9] dark:bg-[#2E90FA]/20 dark:text-[#60A5FA] flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                80%
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Pass mark</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Needed to clear a topic</span>
            </div>
          </div>
        </section>

        {/* HELP EXPANDABLE GUIDE */}
        {helpOpen && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300">
            <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FEE4E2] text-[#B42318] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">What is knowledge debt?</h3>
              <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
                A list of topics you haven't fully understood yet. The longer they stay open, the harder later topics become.
              </p>
            </div>

            <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E0EDFF] text-[#1849A9] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">Who helps me?</h3>
              <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
                An AI tutor suggests how to learn each topic. A real mentor approves the plan before you see it.
              </p>
            </div>

            <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#D1FADF] text-[#05603A] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">How do I clear a topic?</h3>
              <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] font-semibold leading-relaxed">
                Pass a short quiz with 80% or more. If you don't pass, the AI teaches it a different way and you try again.
              </p>
            </div>
          </section>
        )}

        {/* LEETCODE EVIDENCE SYNC CARD */}
        <LeetCodeStatsCard 
          username={user?.leetcode_username} 
          studentId={selectedStudentId || '1'} 
          onSyncComplete={loadData} 
        />

        {/* STATION TRAIL */}
        <DebtTrail currentState={topDebt?.status || 'CONFIRMED_DEBT'} conceptName={topDebt?.concept || 'Linked Lists'} />

        {/* 2-COLUMN LOWER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          
          {/* LEFT: Topics to work on */}
          <section className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE1F5] dark:border-white/10 pb-3">
              <h2 className="text-xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                Topics to work on
              </h2>
              <span className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8]">
                Tap a topic for details
              </span>
            </div>

            <div className="divide-y divide-[#DCE1F5] dark:divide-white/10">
              {debts.slice(0, 4).map((debt, idx) => {
                const isOpen = openGapIdx === idx;
                const scoreVal = debt.confidence ? Math.round((1 - debt.confidence) * 100) : 40;

                return (
                  <div key={debt.id || idx} className="py-3">
                    <button
                      onClick={() => setOpenGapIdx(isOpen ? null : idx)}
                      className="w-full flex items-center gap-4 text-left py-1 group focus:outline-none"
                    >
                      {/* Circular ring */}
                      <div
                        className="w-[52px] h-[52px] rounded-full shrink-0 flex items-center justify-center p-[3px]"
                        style={{
                          background: `conic-gradient(${scoreVal >= 80 ? '#12B76A' : scoreVal >= 50 ? '#2E90FA' : '#F04438'} ${scoreVal}%, #DDE1F5 0)`
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-[#F8F9FE] dark:bg-[#1A204C] flex items-center justify-center font-extrabold text-xs text-[#1B2150] dark:text-[#F1F5F9]">
                          {scoreVal}%
                        </div>
                      </div>

                      <div className="flex-1">
                        <b className="block text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                          {debt.concept}
                        </b>
                        <StatusBadge status={debt.status} />
                      </div>

                      <span className={`text-[#5A6190] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pt-3 pb-2 pl-[68px] text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8] space-y-3">
                        <p>
                          <strong className="text-[#1B2150] dark:text-white font-extrabold mr-1">
                            What is going wrong:
                          </strong>
                          {debt.root_cause || 'Prerequisite confusion in dereferencing memory addresses before pointer traversal.'}
                        </p>

                        <button
                          onClick={() => navigate('/diagnostic')}
                          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full font-extrabold text-white bg-[#FF6A2B] hover:bg-[#E8591C] shadow-soft"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Start check-up quiz</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT: Mastery & Recent Results */}
          <div className="space-y-6">
            
            {/* Topic Mastery Bars */}
            <section className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE1F5] dark:border-white/10 pb-3">
                <h2 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                  How well you know each topic
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Programming basics', val: 100, color: '#12B76A' },
                  { name: 'Arrays and indexing', val: 85, color: '#12B76A' },
                  { name: 'Pointers & Memory', val: 55, color: '#2E90FA' },
                  { name: 'Linked Lists', val: 40, color: '#F04438' },
                  { name: 'Trees and graphs', val: 25, color: '#F04438' },
                ].map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-bold text-xs text-[#1B2150] dark:text-[#F1F5F9]">
                      <span>{m.name}</span>
                      <span>{m.val}%</span>
                    </div>
                    <div className="h-[10px] rounded-full bg-[#DDE1F5] dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${m.val}%`, backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-bold text-[#5A6190] dark:text-[#94A3B8] pt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />Solid</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E90FA]" />Getting there</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F04438]" />Needs practice</span>
              </div>
            </section>

            {/* Recent Results */}
            <section className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE1F5] dark:border-white/10 pb-3">
                <h2 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                  Recent results
                </h2>
                <span className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8]">
                  Newest first
                </span>
              </div>

              <div className="divide-y divide-[#DCE1F5] dark:divide-white/10">
                {(allEvidence.length > 0 ? allEvidence.slice(0, 3) : [
                  { timestamp: 'Yesterday', title: 'Quiz 2 retake', score: 60, concept: 'Linked Lists' },
                  { timestamp: '2 days ago', title: 'Midterm Q4', score: 40, concept: 'Linked Lists' },
                  { timestamp: '4 days ago', title: 'Lab assignment 3', score: 35, concept: 'Linked Lists' }
                ]).map((ev, i) => (
                  <div key={i} className="grid grid-cols-[88px_1fr_88px] gap-3 items-center py-3">
                    <span className="text-xs font-bold text-[#5A6190] dark:text-[#94A3B8]">
                      {ev.timestamp || 'Recent'}
                    </span>
                    <div>
                      <b className="block text-sm font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                        {ev.title || ev.source || 'Check-up Quiz'}
                      </b>
                      <small className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8] block">
                        {ev.concept || 'Linked Lists'}
                      </small>
                    </div>
                    <div className="relative text-right">
                      <b className="text-xs font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                        {ev.score}%
                      </b>
                      <div className="h-2 rounded-full bg-[#DDE1F5] dark:bg-slate-700 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${ev.score}%`,
                            backgroundColor: ev.score >= 80 ? '#12B76A' : ev.score >= 50 ? '#F79009' : '#F04438'
                          }}
                        />
                      </div>
                      {/* 80% mark tick line */}
                      <i className="absolute right-[20%] -bottom-1 w-[2px] h-3.5 bg-[#1B2150] dark:bg-white not-italic" title="80% pass mark" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-[#D1FADF] text-[#05603A] font-extrabold text-xs">
                Nice progress: your Linked Lists score went from 35% to 60%.
              </div>
              <div className="text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">
                The black tick on each bar is the 80% pass mark.
              </div>
            </section>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}

