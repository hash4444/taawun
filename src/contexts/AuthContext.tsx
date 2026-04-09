import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string; // Add if schema has it, or derived
  // Add other fields as needed
}

interface User {
  id: string;
  email: string;
  role: string;
  profile?: Profile;
  // Add company if needed
}

interface AuthContextType {
  user: User | null;
  profile: Profile | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'not_started'; // Mock or real
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  signInWithGoogle: (role?: string) => void;
  signOut: () => void;
  setSessionFromToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode token or fetch user profile
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    await fetchUser(data.access_token);
  };

  const register = async (email: string, password: string, role: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    await fetchUser(data.access_token);
  };

  const signInWithGoogle = (role?: string) => {
    const intent = role ? `?intent=${role}` : '';
    window.location.href = `${API_URL}/auth/google${intent}`;
  };

  const signOut = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const setSessionFromToken = (token: string) => {
    localStorage.setItem('access_token', token);
    fetchUser(token);
  }

  // Derived state
  const profile = user?.profile;
  const verificationStatus = 'not_started'; // Placeholder until backend verification module is active

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated: !!user,
      isLoading,
      verificationStatus,
      login,
      register,
      signInWithGoogle,
      signOut,
      setSessionFromToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
