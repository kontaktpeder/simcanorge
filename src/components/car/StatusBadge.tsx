import { Eye, EyeOff, Send, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'submitted' | 'draft' | 'published' | 'archived';
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  submitted: { 
    bg: 'bg-orange-100 dark:bg-orange-950', 
    text: 'text-orange-700 dark:text-orange-300', 
    label: 'Innsendt', 
    icon: Send 
  },
  draft: { 
    bg: 'bg-gray-100 dark:bg-gray-900', 
    text: 'text-gray-700 dark:text-gray-300', 
    label: 'Kladd', 
    icon: EyeOff 
  },
  published: { 
    bg: 'bg-green-100 dark:bg-green-950', 
    text: 'text-green-700 dark:text-green-300', 
    label: 'Publisert', 
    icon: Eye 
  },
  archived: { 
    bg: 'bg-slate-100 dark:bg-slate-900', 
    text: 'text-slate-500 dark:text-slate-400', 
    label: 'Arkivert', 
    icon: Archive 
  },
};

export function StatusBadge({ 
  status, 
  showIcon = true, 
  className = '',
  size = 'md'
}: StatusBadgeProps) {
  const { bg, text, label, icon: Icon } = statusConfig[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };
  
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span className={cn(
      bg, 
      text, 
      sizeClasses[size], 
      'rounded font-display flex items-center gap-1 w-fit',
      className
    )}>
      {showIcon && <Icon className={iconSize[size]} />}
      {label}
    </span>
  );
}

// Helper function to get car status from car object
export function getCarStatus(car: { 
  status?: 'submitted' | 'draft' | 'published' | 'archived'; 
  published_at?: string | null 
}): 'submitted' | 'draft' | 'published' | 'archived' {
  if (car.status) return car.status;
  return car.published_at ? 'published' : 'draft';
}
