import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];
export type VerificationStatus = 'verified' | 'pending' | 'pending_review' | 'rejected' | 'not_started';

/** Roles must come from user_roles, never editable authentication metadata. */
export function trustedRole(rows: { role: string }[]): AppRole | null {
  for (const role of ['admin', 'business', 'worker'] as const) {
    if (rows.some(row => row.role === role)) return role;
  }
  return null;
}

export function verificationStatus(value: unknown): VerificationStatus {
  return ['verified', 'pending', 'pending_review', 'rejected'].includes(String(value))
    ? value as VerificationStatus : 'not_started';
}

export function accountHome(user: { role: AppRole | null; needsOnboarding?: boolean } | null): string {
  if (!user) return '/auth/login';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'business') return '/business/dashboard';
  return user.needsOnboarding ? '/worker/profile/setup' : '/worker/home';
}

/** Callback destinations remain inside the authenticated user's audience. */
export function safeAuthRedirect(path: string | null, role: AppRole | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\r\n]/.test(path)) return null;
  const prefix = role === 'admin' ? '/admin' : role === 'business' ? '/business' : '/worker';
  const parsed = new URL(path, 'https://taawun.invalid');
  if (parsed.origin !== 'https://taawun.invalid') return null;
  return parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`) ? parsed.pathname + parsed.search + parsed.hash : null;
}

export function signupRole(value: string | null | undefined): 'worker' | 'business' {
  return value === 'business' ? 'business' : 'worker';
}

export function reviewedVerification(record?: { verification_status?: string; verification_reviewed_at?: string | null; verification_reviewed_by?: string | null } | null): VerificationStatus {
  const status = verificationStatus(record?.verification_status);
  return status === 'verified' && (!record?.verification_reviewed_at || !record?.verification_reviewed_by) ? 'pending_review' : status;
}
