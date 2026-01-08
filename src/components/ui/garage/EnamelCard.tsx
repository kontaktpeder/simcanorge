import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EnamelCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function EnamelCard({
  children,
  className,
  onClick,
  hover = true,
}: EnamelCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-card border-2 border-chrome rounded-xl p-6 text-left w-full',
        'shadow-md',
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}
