import { useInView } from "@/hooks/useInView";
import { useEffect, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** If true, animate on mount instead of waiting for scroll into view */
  triggerOnMount?: boolean;
}

export function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  triggerOnMount = false
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  const [mountTriggered, setMountTriggered] = useState(false);

  useEffect(() => {
    if (triggerOnMount) {
      // Small delay to allow initial render, then trigger animation
      const timer = setTimeout(() => setMountTriggered(true), 50);
      return () => clearTimeout(timer);
    }
  }, [triggerOnMount]);

  const shouldAnimate = triggerOnMount ? mountTriggered : isInView;
  
  return (
    <div
      ref={triggerOnMount ? undefined : ref}
      className={`transition-all duration-700 ease-out ${
        shouldAnimate 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
