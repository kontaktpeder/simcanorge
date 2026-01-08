import { ReactNode } from 'react';
import { BigActionButton } from './BigActionButton';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-6', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-muted-foreground/50 [&>svg]:w-16 [&>svg]:h-16 [&>svg]:mx-auto">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl md:text-2xl mb-2">{title}</h3>
      <p className="text-base text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      {action && (
        <BigActionButton onClick={action.onClick} icon={action.icon}>
          {action.label}
        </BigActionButton>
      )}
    </div>
  );
}
