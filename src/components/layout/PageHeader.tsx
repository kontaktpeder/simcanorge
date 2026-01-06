import simcaSwallow from "@/assets/simca-swallow.png";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="poster-section poster-section-blue relative overflow-hidden py-8 md:py-16 lg:py-20">
      <div className="absolute inset-0 stripes-diagonal opacity-30" />
      
      {/* Swallow watermark - subtle on all screen sizes */}
      <img 
        src={simcaSwallow} 
        alt="" 
        aria-hidden="true"
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-20 md:w-32 lg:w-40 opacity-15 md:opacity-20 pointer-events-none -rotate-6"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-2xl md:text-4xl lg:text-5xl text-white mb-2 md:mb-4 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="font-serif text-sm md:text-lg lg:text-xl text-white/85 italic whitespace-pre-line">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
