import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_DEMO_USER = {
  name: "Arun Kumar",
  studentId: "STU001",
  email: "arun@example.com",
  college: "School of Engineering & Technology",
  course: "B.Tech IT",
  year: "3rd Year",
  role: "student",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kde_auth_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kde_is_authenticated') === 'true';
  });

  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    return localStorage.getItem('kde_selected_student_id') || '1';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('kde_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kde_auth_user');
    }
    localStorage.setItem('kde_is_authenticated', isAuthenticated ? 'true' : 'false');
    localStorage.setItem('kde_selected_student_id', String(selectedStudentId));
  }, [user, isAuthenticated, selectedStudentId]);

  const login = async (emailOrId, password, role = 'student') => {
    // Hackathon demo authentication logic
    let currentUser = { ...DEFAULT_DEMO_USER };
    
    if (role === 'mentor') {
      currentUser = {
        name: "Dr. Elena Vance",
        studentId: "MTR-808",
        email: emailOrId || "elena.vance@university.edu",
        college: "Department of Computer Science",
        course: "Faculty Mentor",
        year: "Senior Lecturer",
        role: "mentor",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
      };
    } else if (emailOrId) {
      currentUser.email = emailOrId.includes('@') ? emailOrId : `${emailOrId.toLowerCase()}@example.com`;
      if (!emailOrId.includes('@')) {
        currentUser.studentId = emailOrId.toUpperCase();
      }
    }

    setUser(currentUser);
    setIsAuthenticated(true);
    return { success: true, user: currentUser };
  };

  const register = async (formData) => {
    const newUser = {
      name: formData.fullName,
      studentId: formData.studentId || `STU${Math.floor(100 + Math.random() * 900)}`,
      email: formData.email,
      college: formData.college || "University Institute",
      course: formData.course || "B.Tech Computer Science",
      year: formData.year || "1st Year",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
    };

    setUser(newUser);
    setIsAuthenticated(true);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('kde_auth_user');
    localStorage.removeItem('kde_is_authenticated');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout,
      selectedStudentId,
      setSelectedStudentId
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
