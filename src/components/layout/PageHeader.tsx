import { forwardRef } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle }, ref) => {
    return (
      <section ref={ref} className="relative overflow-hidden py-10 md:py-16 lg:py-20" style={{ background: '#0d0d0d' }}>
        {/* Subtle noise */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />
        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />

        <div className="max-w-[1400px] mx-auto px-5 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-4xl lg:text-5xl text-white font-light tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 md:mt-4 text-sm md:text-base lg:text-lg text-white/40 tracking-wide whitespace-pre-line leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }
);

PageHeader.displayName = "PageHeader";
