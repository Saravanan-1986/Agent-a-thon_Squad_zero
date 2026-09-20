import React, { useEffect, useState } from 'react';

/**
 * ScoreGauge Component
 * Renders the circular arc gauge visualization matching knowledge-debt-home-v2.html
 */
export default function ScoreGauge({ score = 0, maxScore = 100 }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(progress * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  // Dashoffset logic for 267 total dasharray
  const dashOffset = 267 * (1 - Math.min(Math.max(score, 0), maxScore) / maxScore);

  let goalText = "Low: you're in the clear. Great work!";
  if (score >= 60) {
    goalText = "High: needs attention. Under 30 means you're in the clear.";
  } else if (score >= 30) {
    goalText = "Medium: getting there. Under 30 means you're in the clear.";
  }

  return (
    <div className="bg-[#F8F9FE] dark:bg-[#1A204C] text-[#1B2150] dark:text-[#F1F5F9] border border-[#DCE1F5] dark:border-white/10 rounded-[20px] p-6 text-center shadow-soft flex flex-col justify-between items-center h-full">
      <div className="w-full max-w-[240px] mx-auto relative pt-2">
        <svg viewBox="0 0 200 110" aria-hidden="true" className="w-full block mx-auto">
          <defs>
            <linearGradient id="gaugeGradient" x1="0" x2="1">
              <stop offset="0" stopColor="#12B76A" />
              <stop offset="0.5" stopColor="#F79009" />
              <stop offset="1" stopColor="#F04438" />
            </linearGradient>
          </defs>
          <path
            d="M15 100A85 85 0 0 1 185 100"
            fill="none"
            stroke="#DDE1F5"
            strokeWidth="16"
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />
          <path
            d="M15 100A85 85 0 0 1 185 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="267"
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1) .2s' }}
          />
        </svg>
        <div className="text-[44px] font-extrabold leading-none -mt-12 text-[#1B2150] dark:text-[#F1F5F9]">
          {displayScore}
        </div>
        <div className="font-bold text-[#5A6190] dark:text-[#94A3B8] text-xs mt-1.5">
          Knowledge debt score
        </div>
      </div>

      <div className="mt-4 w-full p-3 rounded-xl bg-[#EDEAFF] dark:bg-[#5B4BFF]/20 text-[#2F2A8C] dark:text-[#C9C3FF] font-bold text-xs leading-relaxed">
        {goalText}
      </div>
    </div>
  );
}

