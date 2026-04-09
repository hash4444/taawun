import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backPath?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, showBack, backPath, action, className }: PageHeaderProps) {
  const navigate = useNavigate();
  const { isRTL } = useApp();
  
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('px-4 pt-5 sm:pt-6 pb-4', className)}>
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted transition-colors mb-1"
        >
          <BackIcon size={24} />
        </button>
      )}
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-foreground leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-base text-muted-foreground/80 mt-2">{subtitle}</p>
          )}
        </div>
        
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
