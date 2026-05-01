import { CSSProperties } from "react";

/**
 * Bilgarasje car silhouette — the brand mark, redrawn as flowing line-art.
 * Matches the official logo: sleek sports-car profile with a long roofline,
 * sweeping beltline, soft underbody and two subtle wheel arches.
 *
 * Pass `animated` to enable the sequenced "draw-in + glow" loop
 * (keyframes live in index.css under .car-line-draw).
 */
export function CarLineMark({
  className,
  color = "#34eab8",
  strokeWidth = 2.6,
  animated = false,
  style,
}: {
  className?: string;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 820 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className={animated ? "car-line-draw" : undefined}
      >
        {/* 1 — Roof / greenhouse: long arching curve, the signature stroke */}
        <path
          d="M180 148
             C 245 121, 307 101, 390 95
             C 465 90, 533 109, 598 145"
        />
        {/* 2 — Beltline / shoulder: sweeping line under the roof */}
        <path
          d="M95 193
             C 152 166, 205 156, 284 154
             C 385 152, 493 163, 681 153
             C 725 151, 755 161, 798 185"
        />
        {/* 3 — Lower body sweep: ground-hugging underline */}
        <path
          d="M95 193
             C 170 181, 257 186, 355 199
             C 447 211, 552 208, 668 196
             C 725 190, 767 189, 801 194"
        />
        {/* 4 — Front wheel arch */}
        <path
          d="M130 210
             C 162 181, 204 170, 264 171
             C 285 171, 307 176, 332 188"
        />
        {/* 5 — Rear wheel arch */}
        <path
          d="M620 204
             C 649 180, 688 169, 731 172
             C 755 174, 777 182, 798 196"
        />
        {/* 6 — Window detail: small angled accent on A-pillar */}
        <path
          d="M245 136 C 254 124, 264 116, 278 111"
          strokeWidth={strokeWidth * 0.8}
        />
      </g>
    </svg>
  );
}
