import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
    <div className="w-full border-b border-black/10 bg-[#f6f3ee]">
      <div className="max-w-7xl mx-auto h-12 px-4 md:px-6 flex items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg font-sans text-sm font-semibold text-[#071628] hover:bg-black/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#071628] focus-visible:outline-offset-2"
          aria-label="Tilbake"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </button>
      </div>
    </div>
  );
}
