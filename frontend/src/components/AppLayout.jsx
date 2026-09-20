import React, { useState } from 'react';
import TopNav from './TopNav';
import SystemTraceDrawer from './SystemTraceDrawer';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const [traceOpen, setTraceOpen] = useState(false);
  const { selectedStudentId } = useAuth();
  const studentId = selectedStudentId ? (Number(selectedStudentId) || 1) : 1;

  return (
    <div className="min-h-screen text-[#1B2150] dark:text-[#F1F5F9] flex flex-col font-sans selection:bg-[#FF6A2B] selection:text-white">
      {/* Fixed Top Navigation Bar */}
      <TopNav onToggleTrace={() => setTraceOpen(!traceOpen)} />

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 transition-all">
        {children}
      </main>

      {/* Docked Agent Thinking Trace Drawer */}
      <SystemTraceDrawer
        studentId={studentId}
        isOpen={traceOpen}
        onClose={() => setTraceOpen(false)}
      />
    </div>
  );
}
