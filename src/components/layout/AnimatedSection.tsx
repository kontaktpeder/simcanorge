import { useInView } from "@/hooks/useInView";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0 
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
