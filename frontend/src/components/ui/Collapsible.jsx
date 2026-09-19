import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Collapsible({
  title,
  openLabel,
  closeLabel,
  defaultOpen = false,
  children,
  className = '',
  icon: Icon,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const openText = openLabel || `View ${title || 'more'}`;
  const closeText = closeLabel || `Hide ${title || 'more'}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/40 rounded-md py-1 px-1.5"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        <span>{isOpen ? closeText : openText}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="pt-1 transition-all">
          {children}
        </div>
      )}
    </div>
  );
}
