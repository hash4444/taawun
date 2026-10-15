import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthContext';
import { useAuth } from '@/hooks/useAuth';

const mock = vi.hoisted(() => ({
  session: null as { user: Record<string, unknown> } | null,
  listener: null as ((event: string, session: unknown) => void) | null,
  rows: {} as Record<string, unknown>, errors: {} as Record<string, { message: string }>,
  signIn: vi.fn(), signup: vi.fn(), signOut: vi.fn(), oauth: vi.fn(), rpc: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table: string) => {
      const response = () => ({ data: mock.rows[table] ?? null, error: mock.errors[table] || null });
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => response(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(response()).then(resolve) };
      return chain;
    },
    rpc: mock.rpc,
    auth: {
      getSession: async () => ({ data: { session: mock.session }, error: null }),
      onAuthStateChange: (listener: typeof mock.listener) => { mock.listener = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
      signInWithPassword: mock.signIn, signUp: mock.signup, signOut: mock.signOut, signInWithOAuth: mock.oauth,
    },
  },
}));
const authUser = { id: 'u1', email: 'student@example.com', user_metadata: { role: 'SUPER_ADMIN', full_name: 'Untrusted name' } };
let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider>;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear();
  mock.session = { user: authUser };
  mock.errors = {};
  mock.rows = {
    profiles: { id: 'u1', full_name: 'Saved Student', role: 'worker', phone: '+971501234567', city: 'Dubai', country: 'AE', account_initialized: true },
    user_roles: [{ role: 'worker' }], workers: { id: 'u1', verification_status: 'verified', verification_reviewed_at: '2026-10-15', verification_reviewed_by: 'admin-id' },
    businesses: { id: 'u1', verification_status: 'pending_review' },
    student_profiles: { user_id: 'u1', adult_consent_at: '2026-10-15T00:00:00Z', onboarding_completed_at: '2026-10-15T00:00:00Z' },
  };
  mock.signup.mockResolvedValue({ data: { session: null }, error: null });
  mock.signIn.mockResolvedValue({ error: null });
  mock.signOut.mockResolvedValue({ error: null });
  mock.rpc.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe('database-backed authentication', () => {
  it('ignores editable metadata privileges and reads real profile and verification data', async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user?.role).toBe('worker');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.profile?.full_name).toBe('Saved Student');
    expect(result.current.isVerified).toBe(true);
    expect(result.current.user?.needsOnboarding).toBe(false);
  });
  it('derives employer verification and administrator access from trusted records', async () => {
    mock.rows.user_roles = [{ role: 'business' }];
    const { result, unmount } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.verificationStatus).toBe('pending_review'));
    expect(result.current.isVerified).toBe(false);
    unmount(); mock.rows.user_roles = [{ role: 'admin' }];
    const admin = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(admin.result.current.isAdmin).toBe(true));
  });
  it('fails closed on role lookup failures without falling back to metadata', async () => {
    mock.errors.user_roles = { message: 'Role lookup unavailable' };
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull(); expect(result.current.isAdmin).toBe(false);
    expect(result.current.authError).toContain('Role lookup unavailable');
  });
  it('does not treat legacy self-editable verification flags as reviewed approval', async () => {
    mock.rows.workers = { id: 'u1', verification_status: 'verified' };
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isVerified).toBe(false);
    expect(result.current.verificationStatus).toBe('pending_review');
  });
  it('normalizes registration input, preserves phone and name, allowlists account type and reports confirmation', async () => {
    mock.session = null;
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let confirmation: unknown;
    await act(async () => { confirmation = await result.current.register('  Person@Example.COM ', 'long-password', 'business', '+971501234567', 'A Person'); });
    expect(mock.signup).toHaveBeenCalledWith(expect.objectContaining({ email: 'person@example.com', options: expect.objectContaining({ data: { role: 'business', phone: '+971501234567', full_name: 'A Person' } }) }));
    expect(confirmation).toEqual({ requiresEmailConfirmation: true });
  });
  it('normalizes login and clears loaded private account data on successful logout', async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    await act(async () => { await result.current.login(' STUDENT@EXAMPLE.COM ', 'password'); });
    expect(mock.signIn).toHaveBeenCalledWith({ email: 'student@example.com', password: 'password' });
    queryClient.setQueryData(['private-candidates'], [{ email: 'private@example.com' }]);
    await act(async () => { await result.current.signOut(); });
    expect(queryClient.getQueryData(['private-candidates'])).toBeUndefined();
    expect(result.current.user).toBeNull(); expect(result.current.workerData).toBeNull(); expect(result.current.studentData).toBeNull();
  });
  it('surfaces login/logout failures and does not pretend logout succeeded', async () => {
    mock.signIn.mockResolvedValue({ error: new Error('Invalid credentials') });
    mock.signOut.mockResolvedValue({ error: new Error('Network unavailable') });
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    await expect(result.current.login('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
    await expect(result.current.signOut()).rejects.toThrow('Network unavailable');
    expect(result.current.user).not.toBeNull();
  });
  it('prevents provider calls until setup is explicitly enabled', async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.signInWithGoogle()).rejects.toThrow('not been configured');
    expect(mock.oauth).not.toHaveBeenCalled();
  });
  it('requires onboarding when adult consent is missing', async () => {
    mock.rows.student_profiles = { onboarding_completed_at: '2026-10-15', adult_consent_at: null };
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.user?.needsOnboarding).toBe(true));
  });
});
