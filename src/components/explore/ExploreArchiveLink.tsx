import { Link } from "react-router-dom";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const inter = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" } as const;

type Props = {
  className?: string;
  light?: boolean;
};

/** Secondary entry to archive — not a primary tab. */
export function ExploreArchiveLink({ className = "", light = false }: Props) {
  return (
    <div className={className}>
      <Link
        to="/biler"
        className={
          light
            ? "inline-block text-[11px] uppercase tracking-[0.18em] font-bold text-neutral-600 hover:text-[#2b2b2b] transition-colors border-b border-black/15 hover:border-[#fcc419] pb-0.5"
            : "inline-block text-[11px] uppercase tracking-[0.18em] font-bold text-white/55 hover:text-[#34eab8] transition-colors border-b border-white/10 hover:border-[#34eab8]/60 pb-0.5"
        }
        style={light ? inter : oswald}
      >
        Søk i arkivet →
      </Link>
    </div>
  );
}
