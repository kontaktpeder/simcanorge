import { useEffect, useRef, useState } from "react";
import simcaRallye from "@/assets/simca-rallye-yellow.png";

interface GarageIconProps {
  className?: string;
  size?: number;
  animate?: boolean;
  hideCar?: boolean;
}

export function GarageIcon({ className = "", size = 40, animate = false, hideCar = false }: GarageIconProps) {
  const aspectRatio = 96 / 48;
  const width = size * aspectRatio;
  const carRef = useRef<HTMLImageElement>(null);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!animate || animDone) return;
    const car = carRef.current;
    if (!car) return;

    // Start off-screen left, drive smoothly into center
    const startX = -(size * 1.5);
    const endX = 0;
    const duration = 1400;
    let start: number | null = null;

    car.style.transform = `translateX(${startX}px)`;
    car.style.opacity = "0";

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-in-out with gentle deceleration at the end
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const x = startX + (endX - startX) * eased;
      // Fade in during first 20%
      const opacity = Math.min(progress / 0.2, 1);
      car.style.transform = `translateX(${x}px)`;
      car.style.opacity = String(opacity);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimDone(true);
      }
    };

    // Small delay before animation starts
    const timeout = setTimeout(() => requestAnimationFrame(step), 300);
    return () => clearTimeout(timeout);
  }, [animate, animDone, size]);

  return (
    <div
      className={`relative flex items-end justify-center flex-shrink-0 ${className}`}
      style={{ width: `${width}px`, height: `${size}px`, overflow: 'hidden' }}
    >
      <svg viewBox="0 0 96 48" fill="none" className="absolute inset-0 w-full h-full">
        <rect x="4" y="16" width="88" height="32" rx="2" fill="#F5F0E6" stroke="#1B3A5C" strokeWidth="2.5" />
        <path d="M2 18 L48 4 L94 18" stroke="#1B3A5C" strokeWidth="2.5" fill="#1B3A5C" strokeLinejoin="round" />
        <rect x="10" y="20" width="76" height="28" rx="2" fill="#D6DEE8" stroke="#1B3A5C" strokeWidth="2" />
        <line x1="48" y1="8" x2="48" y2="14" stroke="#1B3A5C" strokeWidth="1.5" />
        <path d="M44 14 Q48 17 52 14" stroke="#1B3A5C" strokeWidth="1.5" fill="none" />
        <defs>
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
            <stop offset="50%" stopColor="#EAB308" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Top lantern glow */}
        <circle cx="48" cy="15" r="4" fill="url(#lampGlow)" />
        <circle cx="48" cy="15" r="1.8" fill="#FDE68A" />
        <circle cx="48" cy="15" r="1" fill="#FFFBEB" />
        <line x1="12" y1="46" x2="84" y2="46" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        {/* Left wall lamp */}
        <rect x="6" y="22" width="3" height="5" rx="0.5" fill="#1B3A5C" opacity="0.5" />
        <circle cx="7.5" cy="23" r="3.5" fill="url(#lampGlow)" />
        <circle cx="7.5" cy="23" r="1.3" fill="#FDE68A" />
        <circle cx="7.5" cy="23" r="0.6" fill="#FFFBEB" />
        {/* Right wall lamp */}
        <rect x="87" y="22" width="3" height="5" rx="0.5" fill="#1B3A5C" opacity="0.5" />
        <circle cx="88.5" cy="23" r="3.5" fill="url(#lampGlow)" />
        <circle cx="88.5" cy="23" r="1.3" fill="#FDE68A" />
        <circle cx="88.5" cy="23" r="0.6" fill="#FFFBEB" />
      </svg>
      <img
        ref={carRef}
        src={simcaRallye}
        alt=""
        className="object-contain relative z-10"
        style={{
          height: `${size * 0.8}px`,
          marginBottom: `${-size * 0.06}px`,
          filter: 'saturate(1.4) brightness(1.1)',
          opacity: hideCar ? '0' : (animate && !animDone ? '0' : '1'),
        }}
      />
    </div>
  );
}
