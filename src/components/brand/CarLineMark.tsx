import { CSSProperties } from "react";

/**
 * Bilgarasje car silhouette as a single-stroke SVG, traced from the logo mark.
 * Designed to be animated with strokeDasharray/strokeDashoffset.
 *
 * Use `animated` to play the draw-in loop (used by the route loader).
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
      viewBox="0 0 320 120"
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
        {/* Roof + body silhouette (one continuous flowing stroke) */}
        <path d="M22 78 C 70 70, 110 60, 140 50 C 170 40, 200 38, 224 50 C 250 62, 280 70, 308 78" />
        {/* Lower body line under the roof */}
        <path d="M118 56 C 150 48, 200 50, 226 60" />
        {/* Side accent line (door cut) */}
        <path d="M70 86 C 110 78, 170 76, 210 84" />
        {/* Front wheel arch */}
        <path d="M78 92 C 92 82, 116 82, 130 92" />
        {/* Rear wheel arch */}
        <path d="M236 90 C 250 80, 274 80, 288 90" />
        {/* Window slit hint */}
        <path d="M158 50 L 168 56" strokeWidth={strokeWidth * 0.8} />
      </g>
    </svg>
  );
}
