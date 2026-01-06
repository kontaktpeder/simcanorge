import simcaSwallow from "@/assets/simca-swallow.png";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="poster-section poster-section-blue relative overflow-hidden py-12 md:py-24 lg:py-32">
      <div className="absolute inset-0 stripes-diagonal" />
      {/* Swallow watermark - smaller on mobile, no animation */}
      <div 
        className="absolute inset-0 pointer-events-none hidden sm:block" 
        style={{
          backgroundImage: `url(${simcaSwallow})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '90% 50%',
          backgroundSize: '250px',
          opacity: 0.6,
          transform: 'rotate(-8deg)',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
        }} 
      />
      {/* Smaller swallow on larger screens */}
      <div 
        className="absolute inset-0 pointer-events-none hidden md:block sm:hidden" 
        style={{
          backgroundImage: `url(${simcaSwallow})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '88% 50%',
          backgroundSize: '350px',
          opacity: 0.7,
          transform: 'rotate(-8deg)',
          filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))'
        }} 
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-white mb-3 md:mb-6 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="font-serif text-base md:text-xl lg:text-2xl text-white/90 italic whitespace-pre-line">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
