import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { useSubmitRating } from '@/hooks/useRatings';
import { toast } from 'sonner';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  toUserId: string;
  userName: string;
}

export function RatingDialog({
  open,
  onOpenChange,
  jobId,
  toUserId,
  userName,
}: RatingDialogProps) {
  const { isRTL } = useApp();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const submitMutation = useSubmitRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(isRTL ? 'يرجى اختيار تقييم' : 'Please select a rating');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        jobId,
        toUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      
      toast.success(isRTL ? 'تم إرسال التقييم!' : 'Rating submitted!');
      onOpenChange(false);
      setRating(0);
      setComment('');
    } catch (error: unknown) {
      console.error('Failed to submit rating:', error);
      toast.error(isRTL ? 'فشل إرسال التقييم' : 'Failed to submit rating');
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? `تقييم ${userName}` : `Rate ${userName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={
                      star <= displayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <span className="text-sm text-muted-foreground">
                {displayRating === 5
                  ? (isRTL ? 'ممتاز!' : 'Excellent!')
                  : displayRating === 4
                  ? (isRTL ? 'جيد جداً' : 'Very Good')
                  : displayRating === 3
                  ? (isRTL ? 'جيد' : 'Good')
                  : displayRating === 2
                  ? (isRTL ? 'مقبول' : 'Fair')
                  : (isRTL ? 'ضعيف' : 'Poor')}
              </span>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {isRTL ? 'تعليق (اختياري)' : 'Comment (optional)'}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isRTL ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitMutation.isPending}
            className="w-full"
          >
            {submitMutation.isPending
              ? (isRTL ? 'جاري الإرسال...' : 'Submitting...')
              : (isRTL ? 'إرسال التقييم' : 'Submit Rating')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
