import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { accountHome, type AppRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function RequireRole({ roles, children }: { roles?: AppRole[]; children?: ReactNode }) {
  const { user, isLoading, authError, refreshProfile, signOut } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen grid place-items-center" role="status">Loading your account…</div>;
  if (authError) return <div className="max-w-md mx-auto p-6 space-y-4" role="alert">
    <h1 className="font-semibold">Could not load your account</h1><p>{authError}</p>
    <Button onClick={() => void refreshProfile()}>Retry</Button>
    <Button variant="outline" onClick={() => void signOut().catch(() => undefined)}>Sign out</Button>
  </div>;
  if (!user) return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles?.includes('admin') && user.role !== 'admin') return <div className="max-w-md mx-auto p-6 space-y-4" role="alert"><p>Administrator access is required.</p><Button onClick={() => void signOut().catch(() => undefined)}>Sign out</Button></div>;
  if (roles && (!user.role || !roles.includes(user.role))) return <Navigate to={accountHome(user)} replace />;
  if (user.role === 'worker' && user.needsOnboarding && location.pathname !== '/worker/profile/setup') {
    return <Navigate to="/worker/profile/setup" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
