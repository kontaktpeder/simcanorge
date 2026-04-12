import React from "react";

type BilgarasjeLoaderProps = {
  size?: number;
  className?: string;
};

export default function BilgarasjeLoader({
  size = 220,
  className = "",
}: BilgarasjeLoaderProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      aria-label="Laster innhold"
      role="status"
    >
      <svg
        width={size}
        height={size * 0.42}
        viewBox="0 0 820 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="bilgarasje-loader-svg"
      >
        <g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Top silhouette */}
          <path
            className="draw draw-1"
            d="M28 195
               C70 185, 120 166, 190 138
               C250 114, 313 94, 390 82
               C470 70, 547 79, 613 107
               C665 129, 712 158, 774 194"
          />

          {/* Roof / greenhouse */}
          <path
            className="draw draw-2"
            d="M180 148
               C245 121, 307 101, 390 95
               C465 90, 533 109, 598 145"
          />

          {/* Window line */}
          <path
            className="draw draw-3"
            d="M215 145
               C305 144, 395 144, 562 145"
          />

          {/* Belt line */}
          <path
            className="draw draw-4"
            d="M95 193
               C152 166, 205 156, 284 154
               C385 152, 493 163, 681 153
               C725 151, 755 161, 798 185"
          />

          {/* Lower body sweep */}
          <path
            className="draw draw-5"
            d="M95 193
               C170 181, 257 186, 355 199
               C447 211, 552 208, 668 196
               C725 190, 767 189, 801 194"
          />

          {/* Front wheel arch */}
          <path
            className="draw draw-6"
            d="M130 210
               C162 181, 204 170, 264 171
               C285 171, 307 176, 332 188"
          />

          {/* Rear wheel arch */}
          <path
            className="draw draw-7"
            d="M620 204
               C649 180, 688 169, 731 172
               C755 174, 777 182, 798 196"
          />

          {/* Small window detail */}
          <path
            className="draw draw-8"
            d="M245 136
               C254 124, 264 116, 278 111"
          />
        </g>

        {/* Very soft pulse under the car */}
        <ellipse
          className="glow"
          cx="410"
          cy="245"
          rx="175"
          ry="10"
          fill="currentColor"
          opacity="0.08"
        />

        <style>{`
          .bilgarasje-loader-svg {
            color: rgba(255,255,255,0.92);
            overflow: visible;
          }

          .draw {
            stroke-dasharray: 1200;
            stroke-dashoffset: 1200;
            animation: drawLine 2.2s ease-in-out infinite;
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.08));
          }

          .draw-1 { animation-delay: 0s; }
          .draw-2 { animation-delay: 0.14s; }
          .draw-3 { animation-delay: 0.24s; }
          .draw-4 { animation-delay: 0.34s; }
          .draw-5 { animation-delay: 0.44s; }
          .draw-6 { animation-delay: 0.56s; }
          .draw-7 { animation-delay: 0.68s; }
          .draw-8 { animation-delay: 0.8s; }

          .glow {
            transform-origin: center;
            animation: glowPulse 2.2s ease-in-out infinite;
            filter: blur(8px);
          }

          @keyframes drawLine {
            0% {
              stroke-dashoffset: 1200;
              opacity: 0;
            }
            8% {
              opacity: 0.18;
            }
            20% {
              opacity: 1;
            }
            58% {
              stroke-dashoffset: 0;
              opacity: 0.98;
            }
            78% {
              stroke-dashoffset: 0;
              opacity: 0.98;
            }
            100% {
              stroke-dashoffset: -120;
              opacity: 0;
            }
          }

          @keyframes glowPulse {
            0%, 100% {
              opacity: 0;
              transform: scaleX(0.84);
            }
            45% {
              opacity: 0.08;
              transform: scaleX(1);
            }
            70% {
              opacity: 0.13;
              transform: scaleX(1.04);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .draw,
            .glow {
              animation: none !important;
              stroke-dashoffset: 0;
              opacity: 1;
            }
          }
        `}</style>
      </svg>
    </div>
  );
}
