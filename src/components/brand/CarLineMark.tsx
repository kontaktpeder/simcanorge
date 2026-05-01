import { CSSProperties } from "react";

/**
 * Bilgarasje car silhouette — minimal flowing line-art (matches the brand mark).
 * Three continuous strokes: roof/body, lower body, and two subtle wheel hints.
 * Animate by passing `animated` (uses `.car-line-draw` keyframes in index.css).
 */
export function CarLineMark({
  className,
  color = "#34eab8",
  strokeWidth = 2.4,
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
      viewBox="0 0 320 110"
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
        {/* Roof + body — one elegant flowing curve */}
        <path d="M96 62 C 130 30, 190 30, 224 56 L 232 60" />
        {/* Underbody / ground line — long sweeping stroke */}
        <path d="M30 78 C 90 70, 230 70, 300 78" />
        {/* Front wheel hint */}
        <path d="M70 82 C 86 74, 110 74, 124 82" />
        {/* Rear wheel hint */}
        <path d="M222 82 C 238 74, 262 74, 276 82" />
        {/* Window slit */}
        <path d="M150 44 L 158 52" strokeWidth={strokeWidth * 0.85} />
      </g>
    </svg>
  );
}
