import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ui/ThemeToggle';
import { 
  BrainCircuit, 
  Menu,
  Bell,
  Search,
  X,
  ChevronRight
} from 'lucide-react';
import { getStudents, getPendingReviews } from '../services/api';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [students, setStudents] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState('std-101');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getStudents().then(data => setStudents(data || []));
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
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-4 lg:px-8 flex items-center justify-between transition-colors">
      
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span 
            onClick={() => navigate('/dashboard')}
            className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5"
          >
            <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Knowledge Debt Engine
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-slate-100 font-bold">{getPageBreadcrumb()}</span>
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
            placeholder="Search concepts or evidence..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Right: Actions, Student Switcher, Theme Toggle, Notifications, Avatar */}
      <div className="flex items-center gap-3">
        
        {/* Student Switcher */}
        {students.length > 0 && (
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] mr-1.5 font-bold uppercase">
              Student:
            </span>
            <select
              value={selectedStudentId}
              onChange={handleStudentSelect}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer pr-1 text-xs"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
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
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 z-50 text-xs text-slate-900 dark:text-slate-100 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {notifications.map(n => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                    <div className="font-bold text-blue-900 dark:text-blue-300">{n.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{n.concept} • {n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={user?.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
            />
          </div>
        )}

      </div>

    </header>
  );
}
