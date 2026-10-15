import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';

export default function DeferredModule() {
  const { isRTL } = useApp();
  const { profile } = useAuth();
  return <MarketplaceLayout employer={profile?.role === 'business'} title={isRTL ? 'ميزة لإصدار لاحق' : 'Planned for a later release'}><p className="text-muted-foreground">{isRTL ? 'نركز الآن على فرص الطلاب والتقديم والتوظيف. هذه الميزة غير مفعلة في الإصدار الحالي.' : 'We are focusing on student opportunities, applications and hiring. This feature is not enabled in the current release.'}</p><Button asChild><Link to={profile?.role === 'business' ? '/business/dashboard' : '/worker/explore'}>{isRTL ? 'العودة إلى الفرص' : 'Back to opportunities'}</Link></Button></MarketplaceLayout>;
}
