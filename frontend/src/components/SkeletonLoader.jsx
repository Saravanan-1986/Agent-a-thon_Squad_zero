import React from 'react';
import { CheckCircle2, FileSearch, Inbox, BookOpen, ArrowRight } from 'lucide-react';

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded-full w-1/6" />
      </div>
      <div className="h-6 bg-slate-200 rounded w-2/3" />
      <div className="h-12 bg-slate-100 rounded-xl w-full" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-white rounded-xl border border-slate-200" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = CheckCircle2, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center space-y-3 max-w-lg mx-auto my-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-slate-900">
        {title || 'No items found'}
      </h3>

      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
        {description || 'There are no active entries matching your current view.'}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
