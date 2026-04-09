import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Star, Building2 } from 'lucide-react';
import { useReceivedRatings, useRatingStats } from '@/hooks/useRatings';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function WorkerRatings() {
  const { t, isRTL } = useApp();
  
  const { data: ratings, isLoading } = useReceivedRatings();
  const { data: stats } = useRatingStats();

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return isRTL ? 'اليوم' : 'Today';
    if (diffDays === 1) return isRTL ? 'أمس' : 'Yesterday';
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    if (diffDays < 14) return isRTL ? 'منذ أسبوع' : '1 week ago';
    if (diffDays < 30) return isRTL ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} weeks ago`;
    
    return format(date, 'dd MMM yyyy', { locale: isRTL ? ar : enUS });
  };

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={t('ratings')} 
          showBack 
          backPath="/worker/profile" 
        />
      }
      noPadding
    >
      {/* Overall Rating Card */}
      <div className="px-4 py-4">
        <div className="card-elevated p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">{stats?.average || 0}</span>
            <Star size={32} className="fill-amber-400 text-amber-400" />
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(stats?.average || 0))}
          </div>
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? `بناءً على ${stats?.count || 0} تقييم` 
              : `Based on ${stats?.count || 0} reviews`}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold mb-3">
          {t('recentReviews')}
        </h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !ratings || ratings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star size={48} className="mx-auto mb-3 opacity-50" />
            <p>{t('noRatings')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ratings.map((review) => (
              <div key={review.id} className="card-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {review.jobs?.title || (isRTL ? 'وظيفة' : 'Job')}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ms-2">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <div className="mb-2">{renderStars(review.rating)}</div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
