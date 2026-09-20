import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { getStudentDebts } from '../services/api';
import { Target, CheckCircle2, AlertTriangle, BookOpen, BarChart3 } from 'lucide-react';

export default function ProgressPage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDebts(selectedStudentId || '1')
      .then(d => setDebts(d || []))
      .finally(() => setLoading(false));
  }, [selectedStudentId]);

  const repaidCount = debts.filter(d => d.status === 'REPAID' || d.status === 'CLEAR').length;
  const activeCount = debts.filter(d => d.status !== 'REPAID' && d.status !== 'CLEAR').length;

  const concepts = [
    { name: 'Memory Architecture & Stack/Heap', mastery: 100, status: 'REPAID' },
    { name: 'Pointers & Memory References', mastery: 95, status: 'REPAID' },
    { name: 'Pointer Dereferencing & Null Safety', mastery: 90, status: 'REPAID' },
    { name: 'Singly Linked List Traversal', mastery: 85, status: 'SUSPECTED' },
    { name: 'Linked List Node Insertion', mastery: 75, status: 'IN_INTERVENTION' },
    { name: 'Binary Tree Traversal (DFS/BFS)', mastery: 65, status: 'CLEAR' },
    { name: 'Binary Search Tree Balancing', mastery: 40, status: 'CONFIRMED_DEBT' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1120px] mx-auto pb-10">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] tracking-tight">
            My Progress & Mastery
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6190] dark:text-[#94A3B8] font-semibold mt-1">
            Track your mastery progress for each topic against the 80% pass standard.
          </p>
        </div>

        {/* 3 STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0EDFF] text-[#1849A9] flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                {concepts.length}
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Topics tracked</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Curriculum coverage</span>
            </div>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D1FADF] text-[#05603A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                {repaidCount + 3}
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Cleared & mastered</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Passed with 80%+</span>
            </div>
          </div>

          <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EDEAFF] text-[#5B4BFF] flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-2xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] leading-tight">
                80%
              </b>
              <span className="text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9]">Pass mark</span>
              <span className="block text-[11px] font-semibold text-[#5A6190] dark:text-[#94A3B8]">Required for clearance</span>
            </div>
          </div>
        </div>

        {/* CONCEPT MASTERY BARS */}
        <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-6">
          
          <div className="flex items-center justify-between border-b border-[#DCE1F5] dark:border-white/10 pb-4">
            <h3 className="text-lg font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
              Topic Mastery Levels
            </h3>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#5A6190] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />Solid (80%+)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E90FA]" />Getting there</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F04438]" />Needs practice</span>
            </div>
          </div>

          <div className="space-y-5">
            {concepts.map((c, i) => {
              const isPassed = c.mastery >= 80;
              const barColor = isPassed ? '#12B76A' : c.mastery >= 50 ? '#2E90FA' : '#F04438';

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className="font-extrabold text-[#1B2150] dark:text-white">
                        {c.mastery}%
                      </span>
                    </div>
                  </div>

                  {/* Bar with 80% pass tick line */}
                  <div className="relative w-full h-3 bg-[#DDE1F5] dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.mastery}%`, backgroundColor: barColor }}
                    />
                    {/* 80% Tick Line */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-[#1B2150] dark:bg-white z-10"
                      style={{ left: '80%' }}
                      title="80% Pass Mark Standard"
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}

