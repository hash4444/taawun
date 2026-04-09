import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useWorkerWallet, useWalletBalance } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function WorkerWallet() {
  const { t, isRTL } = useApp();
  const { data: transactions, isLoading } = useWorkerWallet();
  const balance = useWalletBalance();

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'ر.س' : 'SAR'}`;
  };

  return (
    <MobileLayout
      header={<PageHeader title={t('wallet')} />}
      footer={<BottomNav />}
      noPadding
    >
      {/* Balance Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={20} />
            <span className="text-sm opacity-90">
              {t('availableBalance')}
            </span>
          </div>
          
          <div className="text-3xl font-bold mb-6">
            {formatCurrency(balance.available)}
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="opacity-75" />
                <span className="text-xs opacity-75">
                  {t('totalEarnings')}
                </span>
              </div>
              <p className="font-semibold">
                {formatCurrency(balance.total)}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="opacity-75" />
                <span className="text-xs opacity-75">
                  {t('pendingBalance')}
                </span>
              </div>
              <p className="font-semibold">
                {formatCurrency(balance.pending)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Button */}
      <div className="px-4 pb-4">
        <Button className="w-full h-12" size="lg" disabled={balance.available <= 0}>
          {t('requestPayout')}
        </Button>
      </div>

      {/* Transactions */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t('transactionHistory')}
        </h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('noTransactions')}
          </div>
        ) : (
          <div className="card-elevated divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === 'earning' ? 'bg-success-light' : 'bg-muted'
                }`}>
                  {tx.type === 'earning' ? (
                    <ArrowDownRight size={20} className="text-success" />
                  ) : (
                    <ArrowUpRight size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {tx.jobs?.title || (tx.type === 'payout' 
                      ? (isRTL ? 'صرف' : 'Payout') 
                      : (isRTL ? 'تعديل' : 'Adjustment'))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: isRTL ? ar : enUS })}
                  </p>
                </div>
                <span className={`font-semibold ${
                  tx.type === 'earning' ? 'text-success' : 'text-foreground'
                }`}>
                  {tx.type === 'earning' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
