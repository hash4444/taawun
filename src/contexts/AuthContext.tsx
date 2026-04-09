import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  profile?: Profile;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'pending_review' | 'rejected' | 'not_started';
  businessData: Record<string, unknown> | null;
  workerData: Record<string, unknown> | null;
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  signInWithGoogle: (role?: string) => void;
  signOut: () => void;
  setSessionFromToken: (token: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  const firstName = meta.firstName || meta.full_name?.split(' ')[0] || '';
  const lastName = meta.lastName || meta.full_name?.split(' ').slice(1).join(' ') || '';
  return {
    id: su.id,
    email: su.email || '',
    role: meta.role || 'WORKER',
    profile: {
      id: su.id,
      firstName,
      lastName,
      full_name: meta.full_name || `${firstName} ${lastName}`.trim(),
      email: su.email || '',
      phone: meta.phone || su.phone || '',
      role: meta.role || 'WORKER',
      avatarUrl: meta.avatar_url,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const register = async (email: string, password: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) throw new Error(error.message);
  };

  const signInWithGoogle = async (_role?: string) => {
    const { lovable } = await import('@/integrations/lovable');
    await lovable.auth.signInWithOAuth('google');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const setSessionFromToken = (_token: string) => {
    // Sessions managed automatically by Supabase
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(mapSupabaseUser(session.user));
    }
  };

  const profile = user?.profile;
  const verificationStatus = 'not_started' as const;
  const isAdmin = user?.role === 'ADMIN';
  const isVerified = verificationStatus === 'verified';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated: !!user,
      isLoading,
      isAdmin,
      isVerified,
      verificationStatus,
      businessData: null,
      workerData: null,
      login,
      signIn: login,
      register,
      signInWithGoogle,
      signOut,
      setSessionFromToken,
      refreshProfile,
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
