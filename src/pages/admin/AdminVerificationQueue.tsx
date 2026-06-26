import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { usePendingVerifications } from '@/hooks/useKYC';
import { User, Building2, ChevronRight } from 'lucide-react';

interface PendingItem {
  id: string;
  type: 'worker' | 'business';
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
  [key: string]: unknown;
}

export default function AdminVerificationQueue() {
  const { isRTL } = useApp();
  const navigate = useNavigate();
  const { data, isLoading } = usePendingVerifications();

  const allPending: PendingItem[] = [
    ...(data?.workers || []).map(w => ({ ...w, type: 'worker' as const }) as unknown as PendingItem),
    ...(data?.businesses || []).map(b => ({ ...b, type: 'business' as const }) as unknown as PendingItem)
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={isRTL ? 'طلبات التحقق' : 'Verification Queue'} showBack backPath="/admin" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : allPending.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{isRTL ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
        ) : (
          <div className="space-y-3">
            {allPending.map((item) => (
              <div 
                key={item.id} 
                className="card-elevated p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/admin/verification/${item.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                      {item.type === 'worker' ? <User size={20} className="text-primary" /> : <Building2 size={20} className="text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.profiles?.full_name || item.profiles?.email}</p>
                      <p className="text-caption text-muted-foreground">{item.type === 'worker' ? (isRTL ? 'عامل' : 'Worker') : (isRTL ? 'منشأة' : 'Business')}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
