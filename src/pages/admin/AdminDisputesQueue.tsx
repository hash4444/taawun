import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { useOpenDisputes, useUpdateDispute } from '@/hooks/useDisputes';
import { toast } from 'sonner';

export default function AdminDisputesQueue() {
  const { isRTL } = useApp();
  const { user } = useAuth();
  const { data: disputes, isLoading } = useOpenDisputes();
  const updateMutation = useUpdateDispute();

  const handleResolve = async (disputeId: string) => {
    if (!user) return;
    try {
      await updateMutation.mutateAsync({ id: disputeId, status: 'resolved', adminId: user.id });
      toast.success(isRTL ? 'تم الحل' : 'Resolved');
    } catch (error) {
      toast.error(isRTL ? 'فشلت العملية' : 'Operation failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={isRTL ? 'النزاعات' : 'Disputes Queue'} showBack backPath="/admin" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !disputes?.length ? (
          <p className="text-center text-muted-foreground py-12">{isRTL ? 'لا توجد نزاعات مفتوحة' : 'No open disputes'}</p>
        ) : (
          <div className="space-y-3">
            {disputes.map(dispute => (
              <div key={dispute.id} className="card-elevated p-4">
                <p className="font-medium mb-1">{dispute.reason}</p>
                <p className="text-xs text-muted-foreground mb-3">{dispute.status} - {(dispute.profiles as any)?.email}</p>
                <Button size="sm" onClick={() => handleResolve(dispute.id)} disabled={updateMutation.isPending}>{isRTL ? 'حل النزاع' : 'Resolve'}</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
