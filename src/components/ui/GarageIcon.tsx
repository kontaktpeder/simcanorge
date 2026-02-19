import { useEffect, useRef, useState } from "react";
import simcaRallye from "@/assets/simca-rallye-yellow.png";

interface GarageIconProps {
  className?: string;
  size?: number;
  animate?: boolean;
  hideCar?: boolean;
}

export function GarageIcon({ className = "", size = 40, animate = false, hideCar = false }: GarageIconProps) {
  const aspectRatio = 72 / 48;
  const width = size * aspectRatio;
  const carRef = useRef<HTMLImageElement>(null);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!animate || animDone) return;
    const car = carRef.current;
    if (!car) return;

    // Start off-screen left, drive into center
    const startX = -(size * 1.2);
    const endX = 0;
    const duration = 800;
    let start: number | null = null;

    car.style.transform = `translateX(${startX}px)`;
    car.style.opacity = "1";

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const x = startX + (endX - startX) * eased;
      car.style.transform = `translateX(${x}px)`;

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
      <svg viewBox="0 0 72 48" fill="none" className="absolute inset-0 w-full h-full">
        <rect x="4" y="16" width="64" height="32" rx="2" fill="#F5F0E6" stroke="#1B3A5C" strokeWidth="2.5" />
        <path d="M2 18 L36 4 L70 18" stroke="#1B3A5C" strokeWidth="2.5" fill="#1B3A5C" strokeLinejoin="round" />
        <rect x="14" y="20" width="44" height="28" rx="2" fill="#D6DEE8" stroke="#1B3A5C" strokeWidth="2" />
        <line x1="36" y1="8" x2="36" y2="14" stroke="#1B3A5C" strokeWidth="1.5" />
        <path d="M32 14 Q36 17 40 14" stroke="#1B3A5C" strokeWidth="1.5" fill="none" />
        <circle cx="36" cy="15" r="1.5" fill="#EAB308" />
        <line x1="16" y1="46" x2="56" y2="46" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        <rect x="8" y="22" width="3" height="5" rx="0.5" fill="#1B3A5C" opacity="0.5" />
        <circle cx="9.5" cy="23" r="1" fill="#EAB308" opacity="0.7" />
        <rect x="61" y="22" width="3" height="5" rx="0.5" fill="#1B3A5C" opacity="0.5" />
        <circle cx="62.5" cy="23" r="1" fill="#EAB308" opacity="0.7" />
      </svg>
      <img
        ref={carRef}
        src={simcaRallye}
        alt=""
        className="object-contain relative z-10"
        style={{
          height: `${size * 0.65}px`,
          marginBottom: `${size * 0.04}px`,
          filter: 'saturate(1.4) brightness(1.1)',
          opacity: hideCar ? '0' : (animate && !animDone ? '0' : '1'),
        }}
      />
    </div>
  );
}
