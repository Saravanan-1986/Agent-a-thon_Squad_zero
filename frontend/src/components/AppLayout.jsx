import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import SystemTraceDrawer from './SystemTraceDrawer';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedStudentId } = useAuth();
  const studentId = selectedStudentId ? (Number(selectedStudentId) || 1) : 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Universal Floating Agent Thinking Trace */}
      <SystemTraceDrawer studentId={studentId} />
    </div>
  );
}
