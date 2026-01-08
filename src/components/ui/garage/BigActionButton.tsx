import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BigActionButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function BigActionButton({
  children,
  icon,
  variant = 'default',
  size = 'lg',
  onClick,
  disabled,
  className,
  type = 'button',
}: BigActionButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'gap-2 font-medium active:scale-95 transition-transform',
        size === 'lg' && 'min-h-[48px] sm:min-h-[52px] text-sm sm:text-base px-4 sm:px-6',
        size === 'xl' && 'min-h-[56px] sm:min-h-[60px] text-base sm:text-lg px-6 sm:px-8',
        className
      )}
    >
      {icon}
      {children}
    </Button>
  );
}
