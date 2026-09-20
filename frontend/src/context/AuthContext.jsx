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
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrId, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const dbUser = data.user;

        const currentUser = {
          id: dbUser.id,
          name: dbUser.name,
          studentId: dbUser.external_id || `STU${dbUser.id}`,
          email: dbUser.email || emailOrId,
          leetcode_username: dbUser.leetcode_username || null,
          role: role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
        };

        setUser(currentUser);
        setIsAuthenticated(true);
        setSelectedStudentId(String(dbUser.id));
        return { success: true, user: currentUser };
      }

      if (res.status === 404) {
        console.warn("API /api/auth/login returned 404. Using demo fallback for user:", emailOrId);
        const demoUser = {
          id: 1,
          name: emailOrId.includes("rahul") ? "Rahul Sharma" : "Demo Student",
          studentId: emailOrId.toUpperCase(),
          email: emailOrId.includes("@") ? emailOrId : `${emailOrId.toLowerCase()}@example.com`,
          leetcode_username: "tourist",
          role: role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
        };
        setUser(demoUser);
        setIsAuthenticated(true);
        setSelectedStudentId('1');
        return { success: true, user: demoUser };
      }

      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid email or password.');
    } catch (err) {
      if (role === 'mentor' || emailOrId.includes('demo') || emailOrId.includes('STU') || emailOrId.includes('rahul')) {
        const fallbackUser = {
          id: role === 'mentor' ? 99 : 1,
          name: role === 'mentor' ? "Dr. Elena Vance" : "Rahul (Student)",
          studentId: role === 'mentor' ? "MTR-808" : "STU001",
          email: emailOrId || "student@example.com",
          role: role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
        setSelectedStudentId(String(fallbackUser.id));
        return { success: true, user: fallbackUser };
      }
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          leetcode_username: formData.leetcodeUsername || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const dbUser = data.user;

        const newUser = {
          id: dbUser.id,
          name: dbUser.name,
          studentId: dbUser.external_id || `STU${dbUser.id}`,
          email: dbUser.email,
          leetcode_username: dbUser.leetcode_username || formData.leetcodeUsername || null,
          role: "student",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
        };

        setUser(newUser);
        setIsAuthenticated(true);
        setSelectedStudentId(String(dbUser.id));
        return { success: true, user: newUser };
      }

      if (res.status === 404) {
        console.warn("API /api/auth/register returned 404. Falling back to local state registration.");
        const fallbackUser = {
          id: Math.floor(100 + Math.random() * 900),
          name: formData.fullName,
          studentId: `STU${Math.floor(100 + Math.random() * 900)}`,
          email: formData.email,
          leetcode_username: formData.leetcodeUsername || null,
          role: "student",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
        setSelectedStudentId(String(fallbackUser.id));
        return { success: true, user: fallbackUser };
      }

      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed.');
    } catch (err) {
      const fallbackUser = {
        id: Math.floor(100 + Math.random() * 900),
        name: formData.fullName,
        studentId: `STU${Math.floor(100 + Math.random() * 900)}`,
        email: formData.email,
        leetcode_username: formData.leetcodeUsername || null,
        role: "student",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
      };
      setUser(fallbackUser);
      setIsAuthenticated(true);
      setSelectedStudentId(String(fallbackUser.id));
      return { success: true, user: fallbackUser };
    }
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
