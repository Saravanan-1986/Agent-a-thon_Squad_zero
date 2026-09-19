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

  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!emailOrId || !password) {
      setError('Please enter your email or Student ID and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(emailOrId, password, 'student');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id, pwd, role = 'student', target = '/dashboard') => {
    setEmailOrId(id);
    setPassword(pwd);
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
    <div className="min-h-screen bg-obsidian-980 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-obsidian-900/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800 backdrop-blur-2xl"
      >
        {/* Left Side: Cyber-Academic Branding */}
        <div className="bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-obsidian-950 text-white p-8 sm:p-10 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyber-400 to-indigo-500" />
          
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyber-500/20">
                <BrainCircuit className="w-5 h-5 text-obsidian-950" />
              </div>
              <div>
                <span className="font-extrabold font-display text-lg text-white tracking-tight">
                  Knowledge Debt Engine
                </span>
                <p className="text-[10px] font-mono text-cyber-400 uppercase tracking-wider">
                  Academic Intelligence & DAG Auditing
                </p>
              </div>
            </div>
          </div>

          <div className="my-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/30 text-cyber-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyber-400" />
              <span>Multi-Hop Root Cause Diagnosis</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white leading-tight">
              Turn Invisible Conceptual Gaps into <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 via-blue-400 to-purple-400">Repaid Knowledge Assets</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Unlike static gradebooks, Knowledge Debt tracks persistent conceptual deficit debt across DSA prerequisites using empirical proof verification and human faculty review.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-300 font-sans">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Self-Report Forgery (Evidence Governed)</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Human-in-the-Loop Faculty Calibration</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Personas Strip */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              1-Click Judge & Demo Logins:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('rahul_demo', 'password123', 'student', '/dashboard')}
                className="px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-slate-700/80 text-[11px] font-medium text-cyber-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <User className="w-3 h-3 text-cyber-400" />
                <span>Rahul (Demo Student)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('elena.vance@university.edu', 'mentor123', 'mentor', '/mentor')}
                className="px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-slate-700/80 text-[11px] font-medium text-purple-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <UserCheck className="w-3 h-3 text-purple-400" />
                <span>Dr. Elena (Faculty Desk)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-obsidian-900/60 text-slate-100">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-display text-white">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials or choose a quick demo persona above.
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Email or Student Identifier
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder="rahul_demo or arun@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyber-400 font-mono transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyber-400 font-mono transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-obsidian-950 text-cyber-500 focus:ring-cyber-500 accent-cyber-500"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-cyber-400 font-medium text-[11px] cursor-pointer hover:underline">
                  Reset password
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full mt-2"
                icon={LogIn}
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Need a new student profile?{' '}
              <Link to="/register" className="text-cyber-400 font-bold hover:underline">
                Create an account
              </Link>
            </p>

            <Link
              to="/demo"
              className="text-[11px] text-slate-400 hover:text-cyber-300 font-mono flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <span>Or jump directly to Interactive Judge Demo Mode</span>
              <ArrowRight className="w-3 h-3 text-cyber-400" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
