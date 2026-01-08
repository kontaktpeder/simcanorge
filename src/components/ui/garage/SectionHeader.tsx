import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-4', className)}>
      <div className="flex-1 min-w-0">
        <h2 className="font-display text-xl md:text-2xl flex items-center gap-2">
          {icon && <span className="text-primary shrink-0">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-base text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
