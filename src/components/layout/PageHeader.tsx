import { forwardRef } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle }, ref) => {
    return (
      <section ref={ref} className="relative overflow-hidden py-6 md:py-10 lg:py-12 bg-[#0a0a0a]">
        {/* Bottom hairline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />

        <div className="max-w-[520px] mx-auto px-5 md:px-8 relative z-10">
          <h1 className="text-xl md:text-3xl lg:text-4xl text-white/90 font-light tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 md:mt-3 text-[13px] md:text-[15px] text-white/30 tracking-wide whitespace-pre-line leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </section>
    );
  }
);

PageHeader.displayName = "PageHeader";
