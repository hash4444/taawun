import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
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
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'not_started';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  signInWithGoogle: (role?: string) => void;
  signOut: () => void;
  setSessionFromToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  return {
    id: su.id,
    email: su.email || '',
    role: meta.role || 'WORKER',
    profile: meta.firstName ? {
      id: su.id,
      firstName: meta.firstName || '',
      lastName: meta.lastName || '',
      avatarUrl: meta.avatar_url,
    } : undefined,
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

  const profile = user?.profile;
  const verificationStatus = 'not_started' as const;

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
      setSessionFromToken,
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
