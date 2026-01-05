import simcaSwallow from "@/assets/simca-swallow.png";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="poster-section poster-section-blue relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 stripes-diagonal" />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: `url(${simcaSwallow})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '85% 50%',
          backgroundSize: '450px',
          opacity: 0.15,
          transform: 'rotate(-8deg)'
        }} 
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="font-serif text-xl md:text-2xl text-white/90 italic">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
