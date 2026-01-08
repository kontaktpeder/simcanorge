import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BigActionButton } from './BigActionButton';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
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
    <div className={cn('text-center py-8 sm:py-12 px-4 sm:px-6', className)}>
      {icon && (
        <div className="mx-auto mb-3 sm:mb-4 text-muted-foreground/50 [&>svg]:w-12 [&>svg]:h-12 sm:[&>svg]:w-16 sm:[&>svg]:h-16 [&>svg]:mx-auto">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg sm:text-xl md:text-2xl mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-4 sm:mb-6">
        {description}
      </p>
      {action && (
        action.href ? (
          <Link to={action.href}>
            <BigActionButton icon={action.icon}>
              {action.label}
            </BigActionButton>
          </Link>
        ) : (
          <BigActionButton onClick={action.onClick} icon={action.icon}>
            {action.label}
          </BigActionButton>
        )
      )}
    </div>
  );
}
