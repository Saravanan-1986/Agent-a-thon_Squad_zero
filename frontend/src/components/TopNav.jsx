import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  FileSpreadsheet, 
  BookOpen, 
  History, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Menu, 
  X, 
  User,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ui/ThemeToggle';
import { getStudents } from '../services/api';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/diagnostic', label: 'Diagnostic Quiz', icon: Clock },
  { path: '/student/1', label: 'Debt Ledger', icon: FileSpreadsheet, matchPrefix: '/student' },
  { path: '/interventions', label: 'Fixes & Lessons', icon: BookOpen },
  { path: '/evidence', label: 'Evidence Trail', icon: History },
  { path: '/progress', label: 'My Progress', icon: BarChart3 },
  { path: '/mentor', label: 'Mentor Gate', icon: ShieldCheck },
];

export default function TopNav({ onToggleTrace }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, selectedStudentId, setSelectedStudentId } = useAuth();

  const [students, setStudents] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getStudents().then((data) => {
      setStudents(data || []);
      if (data && data.length > 0 && (!selectedStudentId || selectedStudentId === 'std-101')) {
        setSelectedStudentId(String(data[0].id));
      }
    });

    const match = location.pathname.match(/\/student\/(.+)/);
    if (match && match[1]) {
      setSelectedStudentId(match[1]);
    }
  }, [location.pathname]);

  const handleStudentSelect = (e) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    navigate(`/student/${id}`);
  };

  const isActive = (item) => {
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix);
    }
    return location.pathname === item.path;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F0F2FF]/88 dark:bg-[#1A204C]/95 backdrop-blur-[12px] border-b border-[#DCE1F5] dark:border-white/10">
      <div className="max-w-[1120px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 text-[#1B2150] dark:text-[#F1F5F9] font-extrabold text-[18px] tracking-tight focus-ring"
          >
            <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#5B4BFF] to-[#2E90FA] flex items-center justify-center text-white shadow-soft">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <span className="hidden sm:inline-block">Knowledge Debt Engine</span>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 flex-1 max-w-xl mx-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 h-10 px-3.5 rounded-xl font-bold text-xs transition-all ${
                  active
                    ? 'bg-[#5B4BFF] text-white shadow-soft'
                    : 'text-[#5A6190] dark:text-[#94A3B8] hover:bg-[#E1E5FA] dark:hover:bg-white/10 hover:text-[#1B2150] dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Agent Thinking Trace Badge */}
          {onToggleTrace && (
            <button
              onClick={onToggleTrace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF8FF] text-[#175CD3] dark:bg-[#2E90FA]/15 dark:text-[#60A5FA] border border-[#B2DDFF] dark:border-[#2E90FA]/30 text-xs font-bold hover:scale-105 transition-all shadow-soft"
              title="Open Agent Thinking Trace"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#FF6A2B]" />
              <span className="hidden xl:inline">Agent Trace</span>
            </button>
          )}

          {/* Judge Demo Button */}
          <button
            onClick={() => navigate('/demo')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF6A2B] hover:bg-[#E8591C] text-white text-xs font-extrabold shadow-soft transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pitch</span>
          </button>

          {/* Student Switcher & Profile Avatar */}
          {students.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-200/50 dark:bg-[#22295E] border border-[#DCE1F5] dark:border-white/10 rounded-full pl-3 pr-1 py-1 text-xs">
              <select
                value={selectedStudentId || '1'}
                onChange={handleStudentSelect}
                className="bg-transparent text-[#1B2150] dark:text-[#F1F5F9] font-extrabold focus:outline-none cursor-pointer text-xs pr-1"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#1A204C] text-[#1B2150] dark:text-[#F1F5F9]">
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-[#FFC53D] to-[#FF6A2B] text-white font-extrabold text-xs flex items-center justify-center shadow-soft shrink-0">
                {(user?.name || 'Rahul').split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-[#5A6190] hover:bg-slate-200/60 dark:hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#1A204C] border-b border-slate-200 dark:border-white/10 px-4 py-3 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#EEECFF] text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#818CF8]'
                    : 'text-[#5F6788] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {students.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs px-2">
              <span className="text-[#5F6788] font-semibold">Select Student Target:</span>
              <select
                value={selectedStudentId || '1'}
                onChange={handleStudentSelect}
                className="bg-slate-100 dark:bg-[#22295E] text-[#5B4BFF] dark:text-[#818CF8] font-bold p-1 rounded-lg text-xs"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
