import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, type AuthContextType, type StudentProfile, type User } from '@/contexts/auth-context-base';
import { signupRole, trustedRole, reviewedVerification } from '@/lib/auth';

export type { Profile } from '@/contexts/auth-context-base';

const INTENT_KEY = 'taawun_oauth_role';
const providers = {
  google: import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true',
  microsoft: import.meta.env.VITE_MICROSOFT_AUTH_ENABLED === 'true',
};

async function loadAccount(authUser: SupabaseUser) {
  let [profileResult, roleResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', authUser.id),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (roleResult.error) throw roleResult.error;
  if (!profileResult.data || !profileResult.data.account_initialized) {
    // Intent selects only the initial public account type; the server validates initialization.
    const storedIntent = sessionStorage.getItem(INTENT_KEY);
    const intent = signupRole(storedIntent || trustedRole(roleResult.data || []));
    const { error } = await supabase.rpc('complete_account_setup', {
      account_role: intent,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      phone: authUser.phone || null,
    });
    if (error) throw new Error(`Account setup is unavailable. ${error.message}`);
    [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (roleResult.error) throw roleResult.error;
  }
  sessionStorage.removeItem(INTENT_KEY);
  const role = trustedRole(roleResult.data || []);
  if (!role || !profileResult.data) throw new Error('Your account profile is incomplete. Please contact support.');
  const [workerResult, businessResult, studentResult] = await Promise.all([
    role === 'worker' ? supabase.from('workers').select('*').eq('id', authUser.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    role === 'business' ? supabase.from('businesses').select('*').eq('id', authUser.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    role === 'worker' ? supabase.from('student_profiles').select('*').eq('user_id', authUser.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const result of [workerResult, businessResult, studentResult]) if (result.error) throw result.error;
  const row = profileResult.data;
  const fullName = row.full_name || '';
  const profile = {
    id: row.id, firstName: fullName.split(' ')[0] || '', lastName: fullName.split(' ').slice(1).join(' '),
    full_name: fullName, email: authUser.email || '', phone: row.phone || '', role,
    city: row.city || '', country: row.country || 'AE', avatarUrl: row.avatar_url || undefined,
    account_initialized: row.account_initialized,
  };
  const student = studentResult.data as StudentProfile | null;
  const user: User = {
    id: authUser.id, email: authUser.email || '', role, profile,
    needsOnboarding: role === 'worker' && (!student?.onboarding_completed_at || !student?.adult_consent_at),
  };
  return { user, worker: workerResult.data, business: businessResult.data, student };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof loadAccount>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const request = useRef(0);
  const identity = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const invalidateAccount = useCallback(() => { request.current += 1; }, []);

  const hydrate = useCallback(async (authUser: SupabaseUser | null) => {
    const current = ++request.current;
    setIsLoading(true);
    setAuthError(null);
    if (identity.current !== (authUser?.id || null)) {
      identity.current = authUser?.id || null;
      setAccount(null);
      queryClient.clear();
    }
    if (!authUser) {
      setAccount(null);
      setIsLoading(false);
      return;
    }
    try {
      const loaded = await loadAccount(authUser);
      if (current === request.current) setAccount(loaded);
    } catch (error) {
      if (current === request.current) {
        setAccount(null); // Never fall back to editable metadata when role/profile reads fail.
        setAuthError(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Could not load your account.');
      }
    } finally {
      if (current === request.current) setIsLoading(false);
    }
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured) { setAuthError('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to connect this environment.'); setIsLoading(false); return; }
    const { data, error } = await supabase.auth.getSession();
    if (error) { setAuthError(error.message); setIsLoading(false); return; }
    await hydrate(data.session?.user || null);
  }, [hydrate]);

  useEffect(() => {
    if (!isSupabaseConfigured) { void refreshProfile(); return; }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Leave the synchronous auth callback before querying Supabase again.
      setTimeout(() => { if (active) void hydrate(session?.user || null); }, 0);
    });
    void refreshProfile();
    return () => { active = false; invalidateAccount(); subscription.unsubscribe(); };
  }, [hydrate, refreshProfile, invalidateAccount]);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this environment.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
  };

  const register: AuthContextType['register'] = async (email, password, role, phone, fullName) => {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this environment.');
    const accountRole = signupRole(role);
    sessionStorage.setItem(INTENT_KEY, accountRole);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: {
        data: { role: accountRole, phone: phone?.trim() || '', full_name: fullName?.trim() || '' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return { requiresEmailConfirmation: !data.session };
  };

  const oauth = async (provider: 'google' | 'azure', role?: string) => {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this environment.');
    if (!(provider === 'google' ? providers.google : providers.microsoft)) {
      throw new Error('This sign-in provider has not been configured. Please use email and password.');
    }
    if (role) sessionStorage.setItem(INTENT_KEY, signupRole(role));
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback`, ...(provider === 'azure' ? { scopes: 'email' } : {}) },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    ++request.current;
    setAccount(null);
    setIsLoading(false);
    setAuthError(null);
    identity.current = null;
    queryClient.clear();
    sessionStorage.removeItem(INTENT_KEY);
    localStorage.removeItem(INTENT_KEY); // Remove the former implementation's persistent role intent.
  };

  const user = account?.user || null;
  const status = reviewedVerification(account?.worker || account?.business);
  return <AuthContext.Provider value={{
    user, profile: user?.profile, studentData: account?.student || null,
    isAuthenticated: !!user, isLoading, authError, isAdmin: user?.role === 'admin',
    isVerified: status === 'verified', verificationStatus: status,
    businessData: account?.business || null, workerData: account?.worker || null,
    oauthProviders: providers, login, signIn: login, register,
    signInWithGoogle: role => oauth('google', role), signInWithMicrosoft: role => oauth('azure', role),
    signOut, refreshProfile,
  }}>{children}</AuthContext.Provider>;
}
