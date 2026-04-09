import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type Status = 'not_started' | 'pending_review' | 'verified' | 'rejected' | 'applied' | 'accepted' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  not_started: {
    labelKey: 'notSubmitted' as const,
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground',
  },
  pending_review: {
    labelKey: 'pending' as const,
    icon: Clock,
    className: 'bg-warning-light text-warning',
  },
  verified: {
    labelKey: 'verified' as const,
    icon: CheckCircle,
    className: 'bg-success-light text-success',
  },
  rejected: {
    labelKey: 'rejected' as const,
    icon: XCircle,
    className: 'bg-destructive-light text-destructive',
  },
  applied: {
    labelKey: 'applied' as const,
    icon: Clock,
    className: 'bg-info-light text-info',
  },
  accepted: {
    labelKey: 'accepted' as const,
    icon: CheckCircle,
    className: 'bg-success-light text-success',
  },
  completed: {
    labelKey: 'verified' as const,
    icon: CheckCircle,
    className: 'bg-success-light text-success',
  },
  cancelled: {
    labelKey: 'rejected' as const,
    icon: XCircle,
    className: 'bg-muted text-muted-foreground',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function StatusBadge({ status, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const { t } = useApp();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{t(config.labelKey)}</span>
    </span>
  );
}
