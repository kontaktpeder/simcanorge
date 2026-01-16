/**
 * NewsprintBackground
 * 
 * Gammel avis/magasin-bakgrunn med tung tekstur
 */
export function NewsprintBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base layer: darker warm cream */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'hsl(36, 16%, 82%)',
        }}
      />

      {/* Heavy texture layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            /* Strong vignette */
            radial-gradient(ellipse at center, transparent 30%, hsla(32, 18%, 65%, 0.35) 100%),
            /* Vertical fiber - strong */
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              hsla(35, 30%, 60%, 0.12) 1px,
              transparent 2px
            ),
            /* Horizontal fiber - strong */
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              hsla(30, 25%, 55%, 0.10) 1px,
              transparent 3px
            ),
            /* Diagonal noise */
            repeating-linear-gradient(
              45deg,
              hsla(40, 20%, 50%, 0.06) 0px,
              transparent 1px,
              transparent 2px
            ),
            /* Counter-diagonal */
            repeating-linear-gradient(
              -45deg,
              hsla(35, 25%, 55%, 0.05) 0px,
              transparent 1px,
              transparent 3px
            ),
            /* Coarse grain */
            repeating-linear-gradient(
              0deg,
              hsla(38, 20%, 70%, 0.08) 0px,
              transparent 1px,
              transparent 6px
            ),
            /* Cross-hatch */
            repeating-linear-gradient(
              90deg,
              hsla(34, 18%, 65%, 0.06) 0px,
              transparent 1px,
              transparent 8px
            )
          `,
        }}
      />

      {/* Aged paper spots */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, hsla(32, 35%, 60%, 0.15) 0%, transparent 15%),
            radial-gradient(circle at 90% 35%, hsla(28, 30%, 55%, 0.12) 0%, transparent 20%),
            radial-gradient(circle at 50% 85%, hsla(35, 25%, 62%, 0.14) 0%, transparent 18%),
            radial-gradient(circle at 75% 10%, hsla(30, 28%, 58%, 0.10) 0%, transparent 22%),
            radial-gradient(circle at 25% 60%, hsla(34, 22%, 65%, 0.08) 0%, transparent 25%)
          `,
        }}
      />

      {/* Left rule line */}
      <div 
        className="absolute left-[1.5%] top-0 bottom-0 w-px hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsla(32, 30%, 45%, 0.18) 15%, hsla(32, 30%, 45%, 0.18) 85%, transparent)',
        }}
      />
      
      {/* Right stamp */}
      <div className="absolute right-[2%] top-[10%] hidden xl:block">
        <div 
          className="font-serif text-[8px] tracking-[0.5em] rotate-90 origin-center uppercase"
          style={{ color: 'hsla(32, 25%, 40%, 0.12)' }}
        >
          AUTO · ARCHIVE · 19—
        </div>
      </div>

      {/* Corner fold */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 hidden lg:block"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, hsla(32, 20%, 75%, 0.4) 50%)',
        }}
      />
    </div>
  );
}
