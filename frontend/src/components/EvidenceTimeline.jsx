import React from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, Award } from 'lucide-react';

export default function EvidenceTimeline({ evidenceList = [] }) {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-8 rounded-[20px] bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 text-center text-xs font-semibold text-[#5A6190]">
        No evidence results found for this selection.
      </div>
    );
  }

  // Sort newest first
  const sorted = [...evidenceList].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  return (
    <div className="space-y-6">
      
      {/* LEETCODE PUBLIC EVIDENCE CARD */}
      <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE1F5] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0EA] text-[#FF6A2B] flex items-center justify-center font-extrabold text-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <b className="block text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                LeetCode External Evidence
              </b>
              <span className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8]">
                Public supporting evidence &bull; Synced 2 hours ago
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#D1FADF] text-[#05603A]">
              Synced
            </span>
            <button className="p-2 rounded-full text-[#5A6190] hover:bg-[#E1E5FA] dark:hover:bg-white/10">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-[#22295E] border border-[#DCE1F5] dark:border-white/10">
            <span className="font-semibold text-[#5A6190] block">Target Username</span>
            <b className="text-sm font-extrabold text-[#1B2150] dark:text-white">Karuppasamy654</b>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#22295E] border border-[#DCE1F5] dark:border-white/10">
            <span className="font-semibold text-[#5A6190] block">Linked List Solved</span>
            <b className="text-sm font-extrabold text-[#12B76A]">14 Problems</b>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#22295E] border border-[#DCE1F5] dark:border-white/10">
            <span className="font-semibold text-[#5A6190] block">Evidence Role</span>
            <b className="text-sm font-extrabold text-[#5B4BFF]">Supporting Only (Does not auto-clear)</b>
          </div>
        </div>
      </div>

      {/* AUDIT EVIDENCE CARDS LIST */}
      <div className="bg-[#F8F9FE] dark:bg-[#1A204C] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 shadow-soft space-y-4">
        <h3 className="text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9] border-b border-[#DCE1F5] dark:border-white/10 pb-3">
          Quiz & Diagnostic Attempts
        </h3>

        <div className="divide-y divide-[#DCE1F5] dark:divide-white/10">
          {sorted.map((item, idx) => {
            const isPass = item.passed || item.score >= 80;
            const barColor = isPass ? '#12B76A' : item.score >= 50 ? '#F79009' : '#F04438';

            return (
              <div
                key={item.id || idx}
                className="grid grid-cols-1 sm:grid-cols-[100px_1fr_120px] gap-4 items-center py-4"
              >
                <span className="text-xs font-bold text-[#5A6190] dark:text-[#94A3B8]">
                  {item.timestamp || 'Recently'}
                </span>

                <div>
                  <b className="block text-base font-extrabold text-[#1B2150] dark:text-[#F1F5F9]">
                    {item.concept || 'Diagnostic Assessment'}
                  </b>
                  <span className="text-xs font-semibold text-[#5A6190] dark:text-[#94A3B8]">
                    Source: {item.source || 'Knowledge Debt Engine'}
                  </span>
                  {item.detail && (
                    <p className="text-xs text-[#5A6190] dark:text-[#94A3B8] italic mt-0.5">
                      "{item.detail}"
                    </p>
                  )}
                </div>

                <div className="relative text-right">
                  <span className={`inline-block text-xs font-extrabold mb-1 ${isPass ? 'text-[#05603A]' : 'text-[#B42318]'}`}>
                    {item.score}% {isPass ? '✓ PASS' : '✗ PRACTICE'}
                  </span>
                  <div className="h-2 rounded-full bg-[#DDE1F5] dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.score}%`, backgroundColor: barColor }}
                    />
                  </div>
                  {/* 80% Pass Tick Line */}
                  <i className="absolute right-[20%] -bottom-0.5 w-[2px] h-3 bg-[#1B2150] dark:bg-white not-italic" title="80% pass mark" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

