import { CarLineMark } from "./CarLineMark";

/**
 * Unified loading indicator across the app.
 * Use this everywhere instead of Loader2 / spinners for brand consistency.
 */
export function BrandLoader({
  label = "Laster…",
  size = 140,
  fullscreen = false,
  className,
}: {
  label?: string | null;
  size?: number;
  fullscreen?: boolean;
  className?: string;
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className ?? ""}`}>
      <CarLineMark
        animated
        color="#34eab8"
        strokeWidth={2.4}
        style={{
          width: size,
          height: "auto",
          filter: "drop-shadow(0 0 12px rgba(52,234,184,0.28))",
        }}
      />
      {label && (
        <p
          className="text-[10px] uppercase tracking-[0.32em] text-white/45"
          style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        {content}
      </div>
    );
  }
  return content;
}
