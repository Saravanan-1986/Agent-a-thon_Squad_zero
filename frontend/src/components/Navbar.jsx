import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ui/ThemeToggle';
import { 
  BrainCircuit, 
  Menu,
  Bell,
  Search,
  X,
  ChevronRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { getStudents, getPendingReviews } from '../services/api';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, selectedStudentId, setSelectedStudentId } = useAuth();

  const [students, setStudents] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getStudents().then(data => {
      setStudents(data || []);
      if (data && data.length > 0 && (!selectedStudentId || selectedStudentId === 'std-101')) {
        setSelectedStudentId(String(data[0].id));
      }
    });
    getPendingReviews().then(data => setPendingCount((data || []).length));

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

  const getPageBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/demo') return 'Live Judge Demo';
    if (path === '/dashboard') return 'Overview';
    if (path.startsWith('/student')) return 'Knowledge Debt Ledger';
    if (path === '/interventions') return 'Intervention Strategies';
    if (path === '/evidence') return 'Evidence Audit Trail';
    if (path === '/progress') return 'Progress & Mastery';
    if (path === '/mentor') return 'Mentor Review Desk';
    return 'Platform';
  };

  const notifications = [
    { id: 1, title: 'New Intervention V2 Available', concept: 'Linked Lists', time: '10m ago' },
    { id: 2, title: 'Mentor Approved Strategy', concept: 'Pointers & Memory', time: '1h ago' },
    { id: 3, title: 'Verification Quiz Ready', concept: 'Linked Lists', time: '2h ago' }
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-obsidian-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-obsidian-800/90 text-slate-800 dark:text-white px-4 lg:px-8 flex items-center justify-between transition-colors shadow-2xs dark:shadow-none">
      
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-850 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span 
            onClick={() => navigate('/dashboard')}
            className="hover:text-blue-600 dark:hover:text-cyber-400 cursor-pointer text-slate-800 dark:text-slate-300 font-bold flex items-center gap-2 transition-colors"
          >
            <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
            <span className="font-display tracking-wide">Knowledge Debt</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-white font-medium bg-slate-100 dark:bg-obsidian-850 px-2 py-0.5 rounded border border-slate-200 dark:border-obsidian-750">{getPageBreadcrumb()}</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xs hidden md:block mx-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search DSA concepts..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-obsidian-900/90 border border-slate-200 dark:border-obsidian-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyber-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Right: Actions, Student Switcher, Theme Toggle, Notifications, Avatar */}
      <div className="flex items-center gap-3">
        
        {/* Judge Demo Quick Access Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/demo')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 border border-amber-400/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="tracking-wide">Judge Pitch</span>
        </motion.button>

        {/* Student Switcher */}
        {students.length > 0 && (
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="text-slate-500 text-[10px] mr-1.5 font-mono uppercase font-semibold">
              Target:
            </span>
            <select
              value={selectedStudentId}
              onChange={handleStudentSelect}
              className="bg-transparent text-blue-700 dark:text-cyber-300 font-semibold focus:outline-none cursor-pointer pr-1 text-xs font-mono"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white">
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-850 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 dark:bg-cyber-500 shadow-glow" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-750 rounded-2xl shadow-2xl p-3.5 z-50 text-xs text-slate-900 dark:text-white space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-2">
                  <span className="font-bold font-display text-slate-900 dark:text-white">System Notifications</span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-obsidian-800 hover:border-blue-500/40 dark:hover:border-cyber-500/40 transition-colors space-y-1">
                      <div className="font-semibold text-blue-700 dark:text-cyber-300">{n.title}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{n.concept} • {n.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-obsidian-800 pl-3">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={user?.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-obsidian-700"
            />
          </div>
        )}

      </div>

    </header>
  );
}
