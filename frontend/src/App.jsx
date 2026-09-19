import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Diagnostic from './pages/Diagnostic';
import Student from './pages/Student';
import Mentor from './pages/Mentor';
import ProgressPage from './pages/ProgressPage';
import EvidencePage from './pages/EvidencePage';
import InterventionsPage from './pages/InterventionsPage';
import JudgeDemo from './pages/JudgeDemo';

/**
 * Protected Route Wrapper
 * Redirects unauthenticated users to /login
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StudentRedirect() {
  const { selectedStudentId } = useAuth();
  return <Navigate to={`/student/${selectedStudentId || '1'}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<JudgeDemo />} />

                {/* Diagnostic Slice Route */}
                <Route path="/diagnostic" element={<Diagnostic />} />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />

                
                <Route 
                  path="/student" 
                  element={
                    <ProtectedRoute>
                      <StudentRedirect />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/student/:id" 
                  element={
                    <ProtectedRoute>
                      <Student />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/interventions" 
                  element={
                    <ProtectedRoute>
                      <InterventionsPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/evidence" 
                  element={
                    <ProtectedRoute>
                      <EvidencePage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/progress" 
                  element={
                    <ProtectedRoute>
                      <ProgressPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/mentor" 
                  element={
                    <ProtectedRoute>
                      <Mentor />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
