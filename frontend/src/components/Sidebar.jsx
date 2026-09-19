import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { resetDemoState } from '../services/api';
import { useToast } from './Toast';
import Button from './ui/Button';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  UserCheck, 
  LogOut, 
  X, 
  RotateCcw, 
  Activity 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, selectedStudentId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const handleResetDemo = async () => {
    await resetDemoState();
    showToast('Demo state successfully reset to initial seed values.', 'success');
    window.location.reload();
  };

  const isMentor = user?.role === 'mentor';

  const studentNavItems = [
    { label: 'Judge Pitch Demo', path: '/demo', icon: Sparkles, highlight: true },
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'DSA Diagnostic', path: '/diagnostic', icon: BrainCircuit },
    { label: 'Knowledge Debt', path: `/student/${selectedStudentId || '1'}`, icon: BookOpen },
    { label: 'Interventions', path: '/interventions', icon: Sparkles },
    { label: 'Evidence Trail', path: '/evidence', icon: FileText },
    { label: 'Progress & Mastery', path: '/progress', icon: TrendingUp },
  ];

  const mentorNavItems = [
    { label: 'Judge Pitch Demo', path: '/demo', icon: Sparkles, highlight: true },
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mentor Desk', path: '/mentor', icon: UserCheck },
    { label: 'Student Ledgers', path: `/student/${selectedStudentId || '1'}`, icon: BookOpen },
  ];

  const navItems = isMentor ? mentorNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-obsidian-980/80 backdrop-blur-md z-40 lg:hidden"
        />
      )}

      {/* Sidebar Main Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-white/95 dark:bg-obsidian-950/90 backdrop-blur-xl border-r border-slate-200 dark:border-obsidian-800/90 flex flex-col justify-between shrink-0
        transition-transform duration-300 ease-out lg:translate-x-0 lg:static shadow-sm dark:shadow-none
        ${isOpen ? 'translate-x-0 shadow-2xl shadow-blue-500/10' : '-translate-x-full'}
      `}>
        
        {/* Top Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-obsidian-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-sm dark:shadow-glow">
              <div className="w-full h-full bg-slate-900 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-blue-400 dark:text-cyber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                Knowledge Debt
              </h1>
              <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-cyber-400 uppercase tracking-widest block">
                {isMentor ? 'Mentor Desk' : 'Academic Core v2.0'}
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 py-1.5 flex items-center justify-between">
            <span>Navigation</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.highlight) {
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) => `
                    relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all mb-3 overflow-hidden group
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md dark:from-cyber-500 dark:to-indigo-600 dark:shadow-glow' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-cyber-500/10 dark:text-cyber-300 dark:border-cyber-500/30 dark:hover:bg-cyber-500/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 relative z-10">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-cyber-400 group-hover:rotate-12 transition-transform shrink-0" />
                    <span className="tracking-wide">{item.label}</span>
                  </div>
                  <span className="relative z-10 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-cyber-400/20 dark:text-cyber-300 font-bold border border-blue-300 dark:border-cyber-400/30">
                    LIVE
                  </span>
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs dark:bg-obsidian-850 dark:text-cyber-400 dark:border-cyber-500/30' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-obsidian-850/60'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-cyber-500 rounded-r" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-cyber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Profile & Actions */}
        <div className="mt-auto p-4 border-t border-slate-200 dark:border-obsidian-800/80 space-y-3 shrink-0 bg-slate-50/80 dark:bg-obsidian-950/60">
          
          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 shadow-2xs">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-obsidian-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Rahul Sharma'}
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {user?.course || 'B.Tech CS (Year 2)'}
              </div>
            </div>
          </div>

          {/* Engine Status Tag */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-900/50 border border-slate-200 dark:border-obsidian-800/60 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Engine Status</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active (Gemini)</span>
          </div>

          {/* Reset Demo State Trigger */}
          <button
            onClick={handleResetDemo}
            title="Reset demo seed data for judge presentation"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-medium transition-all dark:bg-obsidian-900 dark:hover:bg-obsidian-850 dark:text-slate-300 dark:hover:text-white dark:border-obsidian-800 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-cyber-400" />
            <span>Reset Demo State</span>
          </button>

          {/* Logout Action Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 text-xs"
            icon={LogOut}
          >
            Logout Account
          </Button>

        </div>

      </aside>
    </>
  );
}
