import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import Button from '../components/ui/Button';
import { BrainCircuit, UserPlus, Lock, Mail, User, GraduationCap, Building2, AlertCircle, Code2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    leetcodeUsername: '',
    college: '',
    course: '',
    year: '1st Year',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed.' });
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
        className="w-full max-w-2xl bg-card-light dark:bg-[#1A204C] rounded-[20px] shadow-soft-lg p-8 sm:p-10 border border-slate-200/80 dark:border-white/10 text-[#1B2150] dark:text-[#F1F5F9] relative"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A2B] to-[#5B4BFF] flex items-center justify-center text-white shadow-glow-orange">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[#1B2150] dark:text-[#F1F5F9]">
              Create Student Account
            </h1>
            <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
              Set up your profile to track learning gap recovery.
            </p>
          </div>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEE4E2] border border-[#FECDCA] text-xs text-[#B42318] font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#F04438] shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-[#F04438] mt-1 font-bold">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="STU-2026 (Optional)"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@example.edu"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
              {errors.email && <p className="text-[11px] text-[#F04438] mt-1 font-bold">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                LeetCode Profile Handle
              </label>
              <div className="relative">
                <Code2 className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="leetcodeUsername"
                  value={formData.leetcodeUsername}
                  onChange={handleChange}
                  placeholder="tourist (Optional)"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Course / Major
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Year of Study
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
              {errors.password && <p className="text-[11px] text-[#F04438] mt-1 font-bold">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B2150] dark:text-[#F1F5F9] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C94B2] absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#1B2150] dark:text-[#F1F5F9] placeholder:text-[#8C94B2] focus-ring"
                />
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-[#F04438] mt-1 font-bold">{errors.confirmPassword}</p>}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full mt-3"
            icon={UserPlus}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 text-center">
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8]">
            Already registered?{' '}
            <Link to="/login" className="text-[#FF6A2B] font-bold hover:underline">
              Sign in to workspace
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
