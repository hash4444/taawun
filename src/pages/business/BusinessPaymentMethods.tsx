import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Check, Trash2 } from 'lucide-react';
import { useBankAccounts, useSetDefaultBankAccount, useDeleteBankAccount } from '@/hooks/useBankAccounts';
import { AddBankAccountDialog } from '@/components/bank/AddBankAccountDialog';
import { toast } from 'sonner';

export default function BusinessPaymentMethods() {
  const { t, isRTL } = useApp();
  const isMobile = useIsMobile();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: bankAccounts, isLoading } = useBankAccounts();
  const setDefaultMutation = useSetDefaultBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      toast.success(isRTL ? 'تم تعيين الحساب كافتراضي' : 'Account set as default');
    } catch {
      toast.error(isRTL ? 'فشل في تعيين الحساب' : 'Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(isRTL ? 'تم حذف الحساب' : 'Account deleted');
    } catch {
      toast.error(isRTL ? 'فشل في حذف الحساب' : 'Failed to delete');
    }
  };

  const maskIban = (iban: string) => {
    if (iban.length <= 8) return iban;
    return `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}`;
  };

  const infoBanner = (
    <div className="bg-primary-light rounded-xl p-4">
      <p className="text-sm text-primary">
        {isRTL
          ? 'سيتم خصم تكاليف الورديات من طريقة الدفع الافتراضية'
          : 'Shift costs will be charged to your default payment method'}
      </p>
    </div>
  );

  const bankAccountsList = isLoading ? (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
      ))}
    </div>
  ) : !bankAccounts || bankAccounts.length === 0 ? (
    <div className="text-center py-8 text-muted-foreground">
      <Building2 size={48} className="mx-auto mb-3 opacity-50" />
      <p>{t('noBankAccounts')}</p>
      <p className="text-sm mt-1">{t('addBankAccountInfo')}</p>
    </div>
  ) : (
    <div className="space-y-3">
      {bankAccounts.map((account) => (
        <div
          key={account.id}
          className={`card-elevated p-4 ${account.is_default ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{account.bank_name}</h3>
                {account.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-caption">
                    <Check size={12} />
                    {t('defaultAccount')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1" dir="ltr">
                {maskIban(account.iban)}
              </p>
            </div>
            <div className="flex gap-1">
              {!account.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isRTL ? 'تعيين كافتراضي' : 'Set as default'}
                  onClick={() => handleSetDefault(account.id)}
                  disabled={setDefaultMutation.isPending}
                >
                  <Check size={18} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={isRTL ? 'حذف الحساب' : 'Delete account'}
                onClick={() => handleDelete(account.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={18} className="text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const addButton = (
    <Button variant="outline" className="w-full h-12" onClick={() => setShowAddDialog(true)}>
      <Plus size={18} className="me-2" />
      {t('addBankAccount')}
    </Button>
  );

  if (!isMobile) {
    return (
      <BusinessDesktopShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-page-title text-foreground">{t('paymentMethods')}</h1>

          {infoBanner}

          <div>
            <h2 className="text-card-title font-semibold text-foreground mb-3">{t('bankAccounts')}</h2>
            {bankAccountsList}
          </div>

          {addButton}
        </div>

        <AddBankAccountDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </BusinessDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={
        <PageHeader
          title={t('paymentMethods')}
          showBack
          backPath="/business/profile"
        />
      }
      noPadding
    >
      {/* Info Banner */}
      <div className="px-4 py-4">
        {infoBanner}
      </div>

      {/* Bank Accounts List */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold mb-3">
          {t('bankAccounts')}
        </h2>
        {bankAccountsList}
      </div>

      {/* Add New Button */}
      <div className="px-4 pb-6">
        {addButton}
      </div>

      <AddBankAccountDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </MobileLayout>
  );
}
