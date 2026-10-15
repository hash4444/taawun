import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useReadNotification } from '@/hooks/useNotifications';
import { MarketplaceLayout, QueryMessage } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { uaeDate } from '@/lib/marketplace';
import { toast } from 'sonner';

export default function WorkerNotifications() {
  const { isRTL } = useApp();
  const { profile } = useAuth();
  const notifications = useNotifications();
  const markRead = useReadNotification();
  const read = async (id: string) => { try { await markRead.mutateAsync(id); } catch { toast.error(isRTL ? 'تعذر تحديث الإشعار' : 'Could not update notification'); } };
  return <MarketplaceLayout employer={profile?.role === 'business'} title={isRTL ? 'الإشعارات' : 'Updates'} description={isRTL ? 'تحديثات طلباتك ومقابلاتك وعروض العمل.' : 'Application, interview and offer updates.'} back>
    {notifications.isError ? <QueryMessage error={notifications.error} onRetry={() => notifications.refetch()} /> : notifications.isLoading ? <div className="h-48 rounded-xl bg-muted animate-pulse" /> : !notifications.data?.length ? <QueryMessage empty={isRTL ? 'أنت على اطلاع بكل شيء. ستظهر التحديثات هنا.' : 'You’re all caught up. New updates will appear here.'} /> : <div className="space-y-3">{notifications.data.map(n => <article key={n.id} className={`card-elevated p-5 flex gap-3 ${!n.read_at ? 'border-primary/40 border' : ''}`}><Bell size={20} className="text-primary shrink-0 mt-1" /><div className="min-w-0 flex-1 space-y-2"><h2 className="font-semibold">{isRTL ? n.title_ar || n.title : n.title}</h2><p className="text-sm text-muted-foreground whitespace-pre-wrap">{isRTL ? n.body_ar || n.body : n.body}</p><p className="text-xs text-muted-foreground">{uaeDate(n.created_at,isRTL)}</p><div className="flex flex-wrap gap-3 items-center">{n.link?.startsWith('/') && !n.link.startsWith('//') && <Link to={n.link} onClick={() => read(n.id)} className="text-sm underline text-primary">{isRTL ? 'عرض التفاصيل' : 'View details'}</Link>}{!n.read_at && <Button size="sm" variant="ghost" disabled={markRead.isPending} onClick={() => read(n.id)}><CheckCheck size={15} className="me-2" />{isRTL ? 'تحديد كمقروء' : 'Mark read'}</Button>}</div></div></article>)}</div>}
  </MarketplaceLayout>;
}
