import React, {
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, AuthContextType, User } from '@/contexts/auth-context-base';

export type { Profile } from '@/contexts/auth-context-base';

function normalizeRole(role?: string | null) {
  if (!role) return 'WORKER';

  const cleaned = role.toUpperCase();

  if (cleaned === 'BUSINESS') return 'BUSINESS';
  if (cleaned === 'RECRUITER') return 'BUSINESS';
  if (cleaned === 'COMPANY_ADMIN') return 'BUSINESS';
  if (cleaned === 'ADMIN') return 'ADMIN';
  if (cleaned === 'SUPER_ADMIN') return 'ADMIN';

  return 'WORKER';
}

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};

  const role = normalizeRole(meta.role);
  const fullName = meta.full_name || meta.name || '';
  const firstName = meta.firstName || fullName.split(' ')[0] || '';
  const lastName = meta.lastName || fullName.split(' ').slice(1).join(' ') || '';

  return {
    id: su.id,
    email: su.email || '',
    role,
    profile: {
      id: su.id,
      firstName,
      lastName,
      full_name: fullName || `${firstName} ${lastName}`.trim(),
      email: su.email || '',
      phone: meta.phone || su.phone || '',
      role: role.toLowerCase(),
      avatarUrl: meta.avatar_url || meta.picture,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(mapSupabaseUser(session.user));
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    refreshProfile();

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const register = async (
    email: string,
    password: string,
    role: string,
    phone?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const normalizedRole = role === 'business' ? 'BUSINESS' : 'WORKER';

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          role: normalizedRole,
          phone: phone || '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async (role?: string) => {
    const normalizedRole = role === 'business' ? 'BUSINESS' : 'WORKER';
  
    localStorage.setItem('taawun_oauth_role', normalizedRole);
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
  
    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const setSessionFromToken = (_token: string) => {
    // Supabase manages browser sessions automatically.
  };

  const profile = user?.profile;
  const verificationStatus: AuthContextType['verificationStatus'] = 'not_started';
  const isAdmin = user?.role === 'ADMIN';
  const isVerified = false;

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
