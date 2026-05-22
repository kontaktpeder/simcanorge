import { NavLink } from "react-router-dom";
import { EXPLORE_SECTION_NAV_HEIGHT_PX } from "@/lib/exploreNav";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function ExploreSectionNav() {

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 sm:flex-none text-center px-4 py-2 text-[11px] sm:text-[12px] uppercase tracking-[0.14em] font-bold transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34eab8] ${
      isActive
        ? "text-[#070b10] bg-[#34eab8] shadow-[0_0_16px_rgba(52,234,184,0.25)]"
        : "text-white/55 hover:text-white/90 hover:bg-white/[0.04]"
    }`;

  return (
    <div
      className="w-full border-b border-white/[0.06]"
      style={{
        height: `${EXPLORE_SECTION_NAV_HEIGHT_PX}px`,
        background: "linear-gradient(180deg, rgba(10,15,21,0.96) 0%, rgba(7,11,16,0.92) 100%)",
        backdropFilter: "blur(8px)",
      }}
      role="navigation"
      aria-label="Velg visning i Utforsk"
    >
      <div className="max-w-[1400px] mx-auto h-full px-3 sm:px-5 md:px-8 flex items-center gap-2 sm:gap-3">
        <span
          className="hidden sm:inline text-[10px] uppercase tracking-[0.28em] text-white/35 font-bold pr-2"
          style={oswald}
        >
          Utforsk
        </span>
        <div className="flex flex-1 sm:flex-none items-center gap-1 sm:gap-1.5" role="tablist">
          <NavLink to="/hjem" end={false} className={tabClass} style={oswald}>
            Feed
          </NavLink>
          <NavLink to="/biler" end={false} className={tabClass} style={oswald}>
            Biler
          </NavLink>
        </div>
      </div>
    </div>
  );
}
