import type { ReactNode } from 'react';
import { RequireRole } from '@/components/auth/RequireRole';

export function AdminRoute({ children }: { children: ReactNode }) {
  return <RequireRole roles={['admin']}>{children}</RequireRole>;
}
