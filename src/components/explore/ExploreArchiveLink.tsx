import { Link } from "react-router-dom";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type Props = {
  className?: string;
};

/** Secondary entry to archive — not a primary tab. */
export function ExploreArchiveLink({ className = "" }: Props) {
  return (
    <div className={className}>
      <Link
        to="/biler"
        className="inline-block text-[11px] uppercase tracking-[0.18em] font-bold text-white/55 hover:text-[#34eab8] transition-colors border-b border-white/10 hover:border-[#34eab8]/60 pb-0.5"
        style={oswald}
      >
        Søk i arkivet →
      </Link>
    </div>
  );
}
