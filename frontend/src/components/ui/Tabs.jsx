import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  const handleKeyDown = (e, tabKey) => {
    const tabKeys = tabs.map(t => t.id || t.key || t);
    const currentIndex = tabKeys.indexOf(tabKey);
    if (e.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabKeys.length;
      onChange(tabKeys[nextIndex]);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (currentIndex - 1 + tabKeys.length) % tabKeys.length;
      onChange(tabKeys[prevIndex]);
    }
  };

  return (
    <div 
      role="tablist"
      aria-label="Content Tabs"
      className={`flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-0 ${className}`}
    >
      {tabs.map((tab) => {
        const key = tab.id || tab.key || tab;
        const label = tab.label || tab;
        const isActive = activeTab === key;
        const count = tab.count;
        const badge = tab.badge;

        return (
          <button
            key={key}
            role="tab"
            id={`tab-${key}`}
            aria-selected={isActive}
            aria-controls={`panel-${key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => handleKeyDown(e, key)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/40 rounded-t-md flex items-center gap-1.5 ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <span>{label}</span>
            {badge && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            )}
            {count !== undefined && count !== null && (
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                isActive 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
