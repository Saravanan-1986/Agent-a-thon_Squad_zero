import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import Button from '../components/ui/Button';
import { BrainCircuit, LogIn, ShieldCheck, UserCheck, Lock, Mail, ArrowRight, Sparkles, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'mentor'
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!emailOrId || !password) {
      setError('Please enter your email/ID and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(emailOrId, password, activeTab);
      navigate(activeTab === 'mentor' ? '/mentor' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id, pwd, role = 'student', target = '/dashboard') => {
    setEmailOrId(id);
    setPassword(pwd);
    setActiveTab(role);
    setLoading(true);
    setError(null);
    try {
      await login(id, pwd, role);
      navigate(target);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#1B2150] dark:text-[#F1F5F9] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-card-light dark:bg-[#1A204C] rounded-[20px] shadow-soft-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-200/80 dark:border-white/10"
      >
        {/* Left Side: Branding */}
        <div className="bg-gradient-to-br from-[#2F2A8C] via-[#5B4BFF] to-[#7A6BFF] text-white p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#DCE1F5] dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-soft">
                <Sparkles className="w-5 h-5 fill-white/20" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-white">
                  Knowledge Debt Engine
                </h1>
                <p className="text-xs text-[#E4E1FF]">
                  Personalized learning recovery
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Guided Remediation</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Turn learning gaps into <span className="text-[#FFC53D]">mastered topics.</span>
              </h2>

              <p className="text-xs text-[#E4E1FF] leading-relaxed font-medium">
                Log in to view your learning trail, complete check-up quizzes, or review mentor-approved lesson plans.
              </p>
            </div>
          </div>

          {/* Quick Demo Personas */}
          <div className="pt-6 border-t border-white/20 space-y-2 mt-6">
            <p className="text-[11px] font-extrabold text-white/80 uppercase tracking-wider">
              Quick Demo Logins:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('rahul_demo', 'password123', 'student', '/dashboard')}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#1B2150] text-xs font-extrabold hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-soft"
              >
                <User className="w-3.5 h-3.5 text-[#FF6A2B]" />
                <span>Rahul (Student)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('elena.vance@university.edu', 'mentor123', 'mentor', '/mentor')}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#1B2150] text-xs font-extrabold hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-soft"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#12B76A]" />
                <span>Dr. Elena (Mentor)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-card-light dark:bg-[#1A204C]">
          <div>
            {/* Student vs Mentor Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#22295E] p-1 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'student'
                    ? 'bg-white dark:bg-[#1A204C] text-[#1B2150] dark:text-[#F1F5F9] shadow-soft'
                    : 'text-[#5F6788] dark:text-[#94A3B8]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mentor')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'mentor'
                    ? 'bg-white dark:bg-[#1A204C] text-[#1B2150] dark:text-[#F1F5F9] shadow-soft'
                    : 'text-[#5F6788] dark:text-[#94A3B8]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Mentor Login
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FEE4E2] border border-[#FECDCA] text-xs text-[#B42318] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1.5">
                  {activeTab === 'student' ? 'Email or Student ID' : 'Mentor Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder={activeTab === 'student' ? 'rahul_demo or student@univ.edu' : 'mentor@univ.edu'}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#5F6788] dark:text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#FF6A2B] focus:ring-[#FF6A2B]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full mt-2"
                icon={LogIn}
              >
                {loading ? 'Signing in...' : `Sign in as ${activeTab === 'student' ? 'Student' : 'Mentor'}`}
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 text-center space-y-2">
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
              Need a new account?{' '}
              <Link to="/register" className="text-[#FF6A2B] font-bold hover:underline">
                Create account
              </Link>
            </p>

            <Link
              to="/demo"
              className="text-xs text-[#5B4BFF] dark:text-[#818CF8] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Explore Judge Demo Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
