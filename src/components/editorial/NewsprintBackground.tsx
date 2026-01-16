import { useEffect, useRef, useState } from 'react';

/**
 * NewsprintBackground
 * 
 * Gir /biler en "gammel avis/magasin"-følelse:
 * - Mørk kremhvit base
 * - Subtil papirtekstur via CSS gradients
 * - Mild parallax på scroll
 * - Nesten usynlige temadetaljer
 */
export function NewsprintBackground() {
  const [bgOffset, setBgOffset] = useState(0);
  const rafRef = useRef<number>();
  const lastScrollRef = useRef(0);

  useEffect(() => {
    // Disable parallax on mobile for performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const handleScroll = () => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Only update if scroll changed significantly
        if (Math.abs(scrollY - lastScrollRef.current) > 2) {
          setBgOffset(scrollY * 0.08); // Slow parallax factor
          lastScrollRef.current = scrollY;
        }
        rafRef.current = undefined;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base layer: warm cream */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'hsl(40, 20%, 94%)',
        }}
      />

      {/* Texture layer with parallax */}
      <div 
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${bgOffset}px)`,
          // Multiple gradient layers for paper texture
          background: `
            /* Vignette edges */
            radial-gradient(ellipse at center, transparent 60%, hsl(35, 15%, 88%) 100%),
            /* Vertical fiber lines */
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 2px,
              hsla(35, 20%, 80%, 0.03) 2px,
              hsla(35, 20%, 80%, 0.03) 3px
            ),
            /* Horizontal fiber lines */
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 4px,
              hsla(30, 15%, 75%, 0.02) 4px,
              hsla(30, 15%, 75%, 0.02) 5px
            ),
            /* Noise-like pattern via small gradients */
            repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 1px,
              hsla(40, 10%, 70%, 0.015) 1px,
              hsla(40, 10%, 70%, 0.015) 2px
            )
          `,
        }}
      />

      {/* Subtle decorative elements - almost invisible */}
      
      {/* Left rule line */}
      <div 
        className="absolute left-[3%] top-0 bottom-0 w-px hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsla(35, 20%, 60%, 0.06) 20%, hsla(35, 20%, 60%, 0.06) 80%, transparent)',
        }}
      />
      
      {/* Right decorative stamp area */}
      <div 
        className="absolute right-[5%] top-[15%] hidden lg:block"
        style={{
          transform: `translateY(${bgOffset * 0.5}px)`,
        }}
      >
        <div 
          className="font-serif text-[10px] tracking-[0.3em] rotate-90 origin-center"
          style={{
            color: 'hsla(35, 15%, 50%, 0.04)',
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
          }}
        >
          AUTO · ARCHIVE · 19—
        </div>
      </div>

      {/* Bottom ornament */}
      <div 
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 hidden md:block"
        style={{
          transform: `translate(-50%, ${bgOffset * 0.3}px)`,
        }}
      >
        <div 
          className="font-serif text-2xl"
          style={{
            color: 'hsla(35, 20%, 55%, 0.03)',
            filter: 'blur(0.5px)',
          }}
        >
          ❧
        </div>
      </div>

      {/* Top-right corner fold illusion */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 hidden lg:block"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, hsla(35, 15%, 85%, 0.15) 50%)',
          opacity: 0.4,
        }}
      />
    </div>
  );
}
