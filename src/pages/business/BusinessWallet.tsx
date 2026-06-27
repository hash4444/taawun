import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, TrendingDown, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useBusinessWallet } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function BusinessWallet() {
  const { t, isRTL } = useApp();
  const isMobile = useIsMobile();
  const { data: transactions, isLoading } = useBusinessWallet();

  // Calculate business wallet balance
  const calculateBalance = () => {
    if (!transactions) return { available: 0, totalPayments: 0, pending: 0 };
    
    const totalPayments = transactions
      .filter(e => e.status === 'paid' || e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const pending = transactions
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // `available` is intentionally 0: wallet_ledger rows for a business are
    // always job payments owed/paid to workers (an expense), and there is no
    // funding/deposit/escrow table tracking money the business has put into
    // the platform. Without that, there's no real balance to report here.
    return { available: 0, totalPayments, pending };
  };

  const balance = calculateBalance();

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'ر.س' : 'SAR'}`;
  };

  if (!isMobile) {
    return (
      <BusinessDesktopShell>
        <div className="space-y-6">
          <h1 className="text-page-title text-foreground">{t('wallet')}</h1>

          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-primary-foreground max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={20} />
              <span className="text-body opacity-90">{t('availableBalance')}</span>
            </div>

            <div className="text-3xl font-bold mb-6">{formatCurrency(balance.available)}</div>

            <div className="flex gap-3">
              <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={14} className="opacity-75" />
                  <span className="text-caption opacity-75">{t('totalPayments')}</span>
                </div>
                <p className="font-semibold">{formatCurrency(balance.totalPayments)}</p>
              </div>
              <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="opacity-75" />
                  <span className="text-caption opacity-75">{t('pendingBalance')}</span>
                </div>
                <p className="font-semibold">{formatCurrency(balance.pending)}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-card-title font-semibold text-foreground">{t('transactionHistory')}</h2>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">{t('noTransactions')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'الوظيفة' : 'Job'}</TableHead>
                    <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              tx.type === 'earning' ? 'bg-success-light' : 'bg-muted'
                            }`}
                          >
                            {tx.type === 'earning' ? (
                              <ArrowDownRight size={18} className="text-success" />
                            ) : (
                              <ArrowUpRight size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-foreground">
                            {tx.jobs?.title || (isRTL ? 'دفع للعامل' : 'Worker Payment')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: isRTL ? ar : enUS })}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground whitespace-nowrap">
                        -{formatCurrency(Number(tx.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </BusinessDesktopShell>
    );
  }

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
                <TrendingDown size={14} className="opacity-75" />
                <span className="text-caption opacity-75">
                  {t('totalPayments')}
                </span>
              </div>
              <p className="font-semibold">
                {formatCurrency(balance.totalPayments)}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="opacity-75" />
                <span className="text-caption opacity-75">
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
                    {tx.jobs?.title || (isRTL ? 'دفع للعامل' : 'Worker Payment')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: isRTL ? ar : enUS })}
                  </p>
                </div>
                <span className="font-semibold text-foreground">
                  -{formatCurrency(Number(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
