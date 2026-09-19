import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  RotateCcw
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
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
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'DSA Diagnostic', path: '/diagnostic', icon: BrainCircuit },
    { label: 'Knowledge Debt', path: '/student/std-101', icon: BookOpen },
    { label: 'Interventions', path: '/interventions', icon: Sparkles },
    { label: 'Evidence Trail', path: '/evidence', icon: FileText },
    { label: 'Progress & Mastery', path: '/progress', icon: TrendingUp },
  ];


  const mentorNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mentor Desk', path: '/mentor', icon: UserCheck },
    { label: 'Student Ledgers', path: '/student/std-101', icon: BookOpen },
  ];

  const navItems = isMentor ? mentorNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Main Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0
        transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>
        
        {/* Top Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shadow-2xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Knowledge Debt
              </h1>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                {isMentor ? 'Mentor Desk' : 'Academic Platform'}
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 border-l-3 border-blue-600 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Profile & Actions */}
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          
          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={user?.name}
              className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'Arun Kumar'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.course || 'B.Tech IT'}
              </div>
            </div>
          </div>

          {/* Reset Demo State Trigger */}
          <button
            onClick={handleResetDemo}
            title="Reset demo seed data for judge presentation"
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Reset Demo State</span>
          </button>

          {/* Logout Action Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            icon={LogOut}
          >
            Logout Account
          </Button>

        </div>

      </aside>
    </>
  );
}
