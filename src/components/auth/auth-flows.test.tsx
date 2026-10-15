import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import OAuthCallback from '@/pages/auth/OAuthCallback';
import Signup from '@/pages/auth/Signup';
import WorkerPersonalInfo from '@/pages/worker/WorkerPersonalInfo';
import BusinessInfo from '@/pages/business/BusinessInfo';
import { RequireRole } from './RequireRole';

const mock = vi.hoisted(() => ({ auth: {} as Record<string, unknown>, update: vi.fn(), upsert: vi.fn(), from: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mock.auth }));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ isRTL: false, t: (key: string) => key }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
vi.mock('@/components/layout/MobileLayout', () => ({ MobileLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/layout/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/layout/WorkerDesktopShell', () => ({ WorkerDesktopShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/layout/BusinessDesktopShell', () => ({ BusinessDesktopShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mock.from } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
function Location() { return <p data-testid="location">{useLocation().pathname}</p>; }
function mount(element: ReactNode, path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/auth/callback" element={element} /><Route path="/auth/signup" element={element} /><Route path="/protected" element={element} /><Route path="/worker/profile/setup" element={path.startsWith('/worker/profile/setup') ? element : <Location />} /><Route path="/business/profile/info" element={element} /><Route path="*" element={<Location />} /></Routes></MemoryRouter>);
}
beforeEach(() => {
  vi.clearAllMocks(); window.location.hash = '';
  mock.auth = {
    user: null, profile: undefined, studentData: null, businessData: null, isLoading: false, authError: null,
    register: vi.fn().mockResolvedValue({ requiresEmailConfirmation: true }),
    refreshProfile: vi.fn().mockResolvedValue(undefined), signOut: vi.fn().mockResolvedValue(undefined),
    oauthProviders: { google: false, microsoft: false }, signInWithGoogle: vi.fn(), signInWithMicrosoft: vi.fn(),
  };
  const result = { data: { id: 'u1' }, error: null };
  mock.from.mockImplementation((table: string) => {
    const chain = {
      update: (value: unknown) => { mock.update(table, value); return chain; },
      upsert: (value: unknown) => { mock.upsert(table, value); return Promise.resolve(result); },
      eq: () => chain, select: () => chain, single: async () => result,
    };
    return chain;
  });
});
afterEach(cleanup);

describe('OAuth callback', () => {
  it('accepts a normal Supabase session without a custom token and respects the audience redirect', async () => {
    mock.auth.user = { id: 'u1', role: 'business' };
    mount(<OAuthCallback />, '/auth/callback?code=normal-supabase-code&redirect=/business/workers');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/business/workers'));
  });
  it('waits while Supabase hydrates a standard callback instead of redirecting prematurely', () => {
    mock.auth.isLoading = true;
    mount(<OAuthCallback />, '/auth/callback?code=normal-supabase-code');
    expect(screen.getByRole('status')).toHaveTextContent('Completing sign in');
    expect(screen.queryByTestId('location')).toBeNull();
  });
  it('shows provider errors and never follows an external return URL', async () => {
    const view = mount(<OAuthCallback />, '/auth/callback?error_description=Access%20was%20denied');
    expect(screen.getByRole('alert')).toHaveTextContent('Access was denied');
    view.unmount(); mock.auth.user = { id: 'u1', role: 'worker' };
    mount(<OAuthCallback />, '/auth/callback?redirect=https://evil.example');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/worker/home'));
  });
});

describe('role guards', () => {
  it('requires authentication and sends incomplete students to profile setup', async () => {
    let view = mount(<RequireRole roles={['worker']}><p>Private page</p></RequireRole>, '/protected');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/auth/login'));
    view.unmount(); mock.auth.user = { id: 'u1', role: 'worker', needsOnboarding: true };
    view = mount(<RequireRole roles={['worker']}><p>Private page</p></RequireRole>, '/protected');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/worker/profile/setup'));
  });
  it('redirects cross-role access and denies administrative access without redirect loops', async () => {
    mock.auth.user = { id: 'u1', role: 'business' };
    const view = mount(<RequireRole roles={['worker']}><p>Private page</p></RequireRole>, '/protected');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/business/dashboard'));
    view.unmount(); mount(<RequireRole roles={['admin']}><p>Admin page</p></RequireRole>, '/protected');
    expect(screen.getByRole('alert')).toHaveTextContent('Administrator access is required');
    expect(screen.queryByText('Admin page')).toBeNull();
  });
  it('fails closed and offers account-load retry on database errors', () => {
    mock.auth.authError = 'Could not load profile';
    mount(<RequireRole><p>Private page</p></RequireRole>, '/protected');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mock.auth.refreshProfile).toHaveBeenCalled();
    expect(screen.queryByText('Private page')).toBeNull();
  });
});

describe('student and employer registration', () => {
  for (const role of ['worker', 'business']) it(`registers ${role} with name and phone and explains confirmation`, async () => {
    mount(<Signup />, `/auth/signup?role=${role}`);
    fireEvent.change(screen.getByLabelText('fullName'), { target: { value: 'A Person' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/), { target: { value: '+971501234567' } });
    fireEvent.change(screen.getByLabelText('password', { exact: true }), { target: { value: 'long-password-123' } });
    fireEvent.change(screen.getByLabelText('confirmPassword'), { target: { value: 'long-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'signup' }));
    await waitFor(() => expect(mock.auth.register).toHaveBeenCalledWith('a@example.com', 'long-password-123', role, '+971501234567', 'A Person'));
    expect(await screen.findByRole('status')).toHaveTextContent('Check your email');
  });
});

describe('real profile editing', () => {
  it('prefills existing student data, blocks missing adult consent, and permits saving incomplete progress', async () => {
    mock.auth.user = { id: 'u1', role: 'worker' };
    mock.auth.profile = { id: 'u1', firstName: 'A', lastName: 'Student', full_name: 'A Student', email: 'a@example.com' };
    mount(<WorkerPersonalInfo />, '/worker/profile/setup');
    expect(screen.getByLabelText('Full name')).toHaveValue('A Student');
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mock.upsert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));
    await waitFor(() => expect(mock.upsert).toHaveBeenCalledWith('student_profiles', expect.objectContaining({ user_id: 'u1', onboarding_completed_at: null, adult_consent_at: null })));
  });
  it('completes a student profile with explicit adult and eligibility consent', async () => {
    mock.auth.user = { id: 'u1', role: 'worker' };
    mock.auth.profile = { id: 'u1', full_name: 'Student', email: 's@example.com' };
    mount(<WorkerPersonalInfo />, '/worker/profile/setup');
    for (const [label, value] of [['University / most recent institution','UAE University'], ['Degree / field of study','Engineering'], ['Graduation year','2027'], ['Skills (separate with commas)','Excel, Communication'], ['Preferred working hours','Weekend mornings']]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.change(screen.getByLabelText('Academic status'), { target: { value: 'undergraduate' } });
    fireEvent.change(screen.getByLabelText('Emirate'), { target: { value: 'Dubai' } });
    fireEvent.change(screen.getByLabelText('Work eligibility information'), { target: { value: 'needs_confirmation' } });
    fireEvent.click(screen.getByLabelText('Part-time'));
    fireEvent.click(screen.getByLabelText(/I confirm the eligibility/));
    fireEvent.click(screen.getByLabelText(/I confirm I am 18/));
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    await waitFor(() => expect(mock.upsert).toHaveBeenCalledWith('student_profiles', expect.objectContaining({ preferred_job_types: ['part_time'], consent_to_matching: false, eligibility_confirmed: true, adult_consent_at: expect.any(String), onboarding_completed_at: expect.any(String) })));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/worker/home'));
  });
  it('saves employer information without touching protected roles or verification', async () => {
    mock.auth.user = { id: 'b1', role: 'business' };
    mock.auth.profile = { full_name: 'Employer', city: 'Dubai' };
    mock.auth.businessData = { trade_name: 'Saved Business', legal_name: 'Saved LLC', sector: 'Technology' };
    mount(<BusinessInfo />, '/business/profile/info');
    expect(screen.getByLabelText('Trade name')).toHaveValue('Saved Business');
    fireEvent.change(screen.getByLabelText('Trade name'), { target: { value: 'Updated Business' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save information' }));
    await waitFor(() => expect(mock.update).toHaveBeenCalledWith('businesses', expect.objectContaining({ trade_name: 'Updated Business' })));
    const write = mock.update.mock.calls.find(([table]) => table === 'businesses')?.[1];
    expect(write).not.toHaveProperty('verification_status'); expect(write).not.toHaveProperty('role');
  });
});
