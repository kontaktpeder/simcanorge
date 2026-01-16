import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FadeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Duration of fade animation in ms */
  fadeDuration?: number;
}

/**
 * Image component that fades in when loaded
 * Prevents flash of unstyled/partial images
 */
export function FadeImage({ 
  className, 
  fadeDuration = 300,
  onLoad,
  style,
  ...props 
}: FadeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  return (
    <img
      {...props}
      onLoad={handleLoad}
      className={cn(
        'transition-opacity',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        ...style,
        transitionDuration: `${fadeDuration}ms`,
      }}
    />
  );
}
