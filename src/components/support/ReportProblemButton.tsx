import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReportProblemButtonProps {
  variant?: 'footer' | 'page' | 'admin' | 'header';
  className?: string;
  onClick?: () => void;
}

export function ReportProblemButton({ variant = 'page', className, onClick }: ReportProblemButtonProps) {
  const buttonText = 'Rapporter et problem';

  if (variant === 'footer') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 text-xs md:text-base text-white/90 hover:text-white transition-colors',
          className
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
        {buttonText}
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'p-1.5 hover:bg-muted/50 rounded-lg transition-colors',
          className
        )}
        aria-label={buttonText}
      >
        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  if (variant === 'admin') {
    return (
      <Button
        onClick={onClick}
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
      >
        <AlertTriangle className="w-4 h-4" />
        {buttonText}
      </Button>
    );
  }

  // Default: page variant
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={cn('gap-2', className)}
    >
      <AlertTriangle className="w-4 h-4" />
      <span className="hidden sm:inline">{buttonText}</span>
    </Button>
  );
}
