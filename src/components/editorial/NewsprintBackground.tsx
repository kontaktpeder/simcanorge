/**
 * NewsprintBackground
 * 
 * Gir /biler en "gammel avis/magasin"-følelse:
 * - Mørkere kremhvit base
 * - Tydelig papirtekstur via CSS gradients
 * - Subtile temadetaljer
 */
export function NewsprintBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base layer: darker warm cream */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'hsl(38, 18%, 88%)',
        }}
      />

      {/* Heavy texture layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            /* Vignette edges - stronger */
            radial-gradient(ellipse at center, transparent 40%, hsla(35, 15%, 75%, 0.25) 100%),
            /* Vertical fiber lines - more visible */
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 1px,
              hsla(35, 25%, 70%, 0.08) 1px,
              hsla(35, 25%, 70%, 0.08) 2px
            ),
            /* Horizontal fiber lines - more visible */
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              hsla(30, 20%, 65%, 0.06) 2px,
              hsla(30, 20%, 65%, 0.06) 3px
            ),
            /* Diagonal noise pattern */
            repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 1px,
              hsla(40, 15%, 60%, 0.04) 1px,
              hsla(40, 15%, 60%, 0.04) 2px
            ),
            /* Counter-diagonal for depth */
            repeating-linear-gradient(
              -45deg,
              transparent 0px,
              transparent 2px,
              hsla(35, 20%, 65%, 0.03) 2px,
              hsla(35, 20%, 65%, 0.03) 3px
            ),
            /* Larger grain pattern */
            repeating-linear-gradient(
              0deg,
              hsla(40, 15%, 80%, 0.04) 0px,
              transparent 1px,
              transparent 8px
            )
          `,
        }}
      />

      {/* Aged paper spots/stains - subtle */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, hsla(35, 30%, 70%, 0.08) 0%, transparent 20%),
            radial-gradient(circle at 85% 45%, hsla(30, 25%, 65%, 0.06) 0%, transparent 25%),
            radial-gradient(circle at 45% 80%, hsla(38, 20%, 72%, 0.07) 0%, transparent 18%),
            radial-gradient(circle at 70% 15%, hsla(32, 22%, 68%, 0.05) 0%, transparent 22%)
          `,
        }}
      />

      {/* Subtle decorative elements */}
      
      {/* Left rule line */}
      <div 
        className="absolute left-[2%] top-0 bottom-0 w-px hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsla(35, 25%, 55%, 0.12) 20%, hsla(35, 25%, 55%, 0.12) 80%, transparent)',
        }}
      />
      
      {/* Right decorative stamp */}
      <div className="absolute right-[3%] top-[12%] hidden xl:block">
        <div 
          className="font-serif text-[9px] tracking-[0.4em] rotate-90 origin-center uppercase"
          style={{
            color: 'hsla(35, 20%, 45%, 0.08)',
          }}
        >
          AUTO · ARCHIVE · 19—
        </div>
      </div>

      {/* Corner fold */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 hidden lg:block"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, hsla(35, 18%, 82%, 0.3) 50%)',
        }}
      />
    </div>
  );
}
