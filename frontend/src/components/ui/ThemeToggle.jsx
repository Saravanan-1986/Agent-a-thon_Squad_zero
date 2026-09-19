import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light Mode"
        className={`p-1.5 rounded-md text-xs font-medium transition-all ${
          theme === 'light'
            ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-800 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`p-1.5 rounded-md text-xs font-medium transition-all ${
          theme === 'dark'
            ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-800 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System Preference"
        className={`p-1.5 rounded-md text-xs font-medium transition-all ${
          theme === 'system'
            ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-800 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
