import { Link } from "react-router-dom";
import { brandHubPath, toBrandKey } from "@/lib/brandSlug";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

interface Props {
  brand: string | null | undefined;
  variant?: "inline" | "chip";
  className?: string;
}

export function BrandHubLink({ brand, variant = "inline", className = "" }: Props) {
  if (!brand || !toBrandKey(brand)) return null;
  const path = brandHubPath(brand);

  if (variant === "chip") {
    return (
      <Link
        to={path}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors ${className}`}
        style={oswald}
      >
        <span className="opacity-60">Merke</span>
        <span>{brand}</span>
        <span aria-hidden>→</span>
      </Link>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} style={oswald}>
      <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Merke:</span>
      <Link
        to={path}
        className="text-[12px] uppercase tracking-[0.18em] text-white/85 hover:text-white underline-offset-4 hover:underline"
      >
        {brand} →
      </Link>
    </span>
  );
}
