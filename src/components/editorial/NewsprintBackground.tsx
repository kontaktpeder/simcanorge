/**
 * NewsprintBackground
 * 
 * Gammel avis/magasin-bakgrunn med tung tekstur.
 * Setter også document/body-bakgrunn for å unngå "hvit glippe" på mobil (Safari UI/overscroll).
 */

import { useEffect } from "react";

const NEWSPRINT_BASE = "hsl(36 16% 82%)";

export function NewsprintBackground() {
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;

    document.documentElement.style.backgroundColor = NEWSPRINT_BASE;
    document.body.style.backgroundColor = NEWSPRINT_BASE;

    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base layer: darker warm cream */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: NEWSPRINT_BASE,
        }}
      />

      {/* Heavy texture layer - primary fibers */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            /* Deep vignette */
            radial-gradient(ellipse at center, transparent 20%, hsla(32, 20%, 58%, 0.45) 100%),
            /* Thick vertical fibers */
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              hsla(32, 35%, 52%, 0.18) 1px,
              hsla(35, 30%, 58%, 0.08) 2px,
              transparent 3px
            ),
            /* Thick horizontal fibers */
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              hsla(30, 32%, 50%, 0.16) 1px,
              hsla(28, 25%, 55%, 0.06) 2px,
              transparent 4px
            )
          `,
        }}
      />

      {/* Secondary grain layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            /* Dense diagonal hatching */
            repeating-linear-gradient(
              45deg,
              hsla(38, 25%, 48%, 0.12) 0px,
              transparent 1px,
              hsla(35, 20%, 55%, 0.04) 2px,
              transparent 3px
            ),
            /* Counter-diagonal hatching */
            repeating-linear-gradient(
              -45deg,
              hsla(32, 28%, 50%, 0.10) 0px,
              transparent 1px,
              hsla(30, 22%, 58%, 0.03) 2px,
              transparent 4px
            ),
            /* Micro vertical lines (pulp fibers) */
            repeating-linear-gradient(
              90deg,
              hsla(36, 30%, 45%, 0.08) 0px,
              transparent 0.5px,
              transparent 1.5px
            ),
            /* Micro horizontal lines */
            repeating-linear-gradient(
              0deg,
              hsla(34, 28%, 48%, 0.06) 0px,
              transparent 0.5px,
              transparent 2px
            )
          `,
        }}
      />

      {/* Coarse grain overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            /* Irregular coarse pattern */
            repeating-linear-gradient(
              17deg,
              hsla(35, 22%, 52%, 0.09) 0px,
              transparent 1px,
              transparent 5px
            ),
            repeating-linear-gradient(
              73deg,
              hsla(30, 25%, 55%, 0.07) 0px,
              transparent 1px,
              transparent 7px
            ),
            repeating-linear-gradient(
              127deg,
              hsla(38, 20%, 50%, 0.06) 0px,
              transparent 1px,
              transparent 4px
            ),
            /* Extra fine noise */
            repeating-linear-gradient(
              163deg,
              hsla(33, 18%, 58%, 0.05) 0px,
              transparent 0.5px,
              transparent 2px
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
          background:
            "linear-gradient(to bottom, transparent, hsla(32, 30%, 45%, 0.18) 15%, hsla(32, 30%, 45%, 0.18) 85%, transparent)",
        }}
      />

      {/* Right stamp */}
      <div className="absolute right-[2%] top-[10%] hidden xl:block">
        <div
          className="font-serif text-[8px] tracking-[0.5em] rotate-90 origin-center uppercase"
          style={{ color: "hsla(32, 25%, 40%, 0.12)" }}
        >
          AUTO · ARCHIVE · 19—
        </div>
      </div>

      {/* Corner fold */}
      <div
        className="absolute top-0 right-0 w-20 h-20 hidden lg:block"
        style={{
          background:
            "linear-gradient(135deg, transparent 50%, hsla(32, 20%, 75%, 0.4) 50%)",
        }}
      />
    </div>
  );
}

