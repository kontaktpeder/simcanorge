import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedCars } from "@/hooks/useSavedCars";
import { useComments } from "@/hooks/useComments";
import { useNavigate, useLocation } from "react-router-dom";
import { FEATURES } from "@/config/features";

interface Props {
  carId: string;
  onOpenComments: () => void;
  onShare: () => void;
  className?: string;
}

export function SpottingReactionsRow({ carId, onOpenComments, onShare, className }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const savedEnabled = FEATURES.savedCars;
  const { isSaved, toggleSave, loading } = useSavedCars();
  const saved = savedEnabled && user ? isSaved(carId) : false;
  const { data: comments } = useComments({ carId });
  const commentCount = comments?.length ?? 0;

  const handleHeart = async () => {
    if (!savedEnabled) return;
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    await toggleSave(carId);
  };

  const iconBtn =
    "inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-[13px]";

  return (
    <div className={`flex items-center gap-6 ${className ?? ""}`}>
      {savedEnabled && (
        <button
          type="button"
          onClick={handleHeart}
          disabled={loading}
          aria-label={saved ? "Fjern hjerte" : "Liker"}
          aria-pressed={saved}
          className={iconBtn}
        >
          <Heart
            className={`w-[22px] h-[22px] transition-colors ${
              saved ? "fill-[#ff5a5f] stroke-[#ff5a5f]" : ""
            }`}
            strokeWidth={1.75}
          />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenComments}
        aria-label="Kommentarer"
        className={iconBtn}
      >
        <MessageCircle className="w-[22px] h-[22px]" strokeWidth={1.75} />
        {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
      </button>

      <button type="button" onClick={onShare} aria-label="Del" className={iconBtn}>
        <Share2 className="w-[22px] h-[22px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
