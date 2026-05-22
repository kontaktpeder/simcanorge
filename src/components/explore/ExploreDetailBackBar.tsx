import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EXPLORE_SECTION_NAV_HEIGHT_PX } from "@/lib/exploreNav";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type Props = {
  /** Fallback when there is no history (direct link / new tab). */
  fallbackTo?: string;
};

export function ExploreDetailBackBar({ fallbackTo = "/hjem" }: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <div
      className="w-full border-b border-white/[0.06]"
      style={{
        height: `${EXPLORE_SECTION_NAV_HEIGHT_PX}px`,
        background: "linear-gradient(180deg, rgba(10,15,21,0.96) 0%, rgba(7,11,16,0.92) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-[720px] mx-auto h-full px-5 md:px-8 flex items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-md text-[11px] sm:text-[12px] uppercase tracking-[0.14em] font-bold text-white/70 hover:text-[#34eab8] hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34eab8]"
          style={oswald}
          aria-label="Tilbake"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </button>
      </div>
    </div>
  );
}
