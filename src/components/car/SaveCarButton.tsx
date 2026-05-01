import { useNavigate, useLocation } from "react-router-dom";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedCars } from "@/hooks/useSavedCars";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/config/features";

interface SaveCarButtonProps {
  carId: string;
  className?: string;
  variant?: "icon" | "full";
}

export function SaveCarButton({ carId, className, variant = "icon" }: SaveCarButtonProps) {
  if (!FEATURES.savedCars) return null;
  return <SaveCarButtonInner carId={carId} className={className} variant={variant} />;
}

function SaveCarButtonInner({ carId, className, variant = "icon" }: SaveCarButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isSaved, toggleSave, loading } = useSavedCars();

  const saved = user ? isSaved(carId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    await toggleSave(carId);
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  const label = saved ? "Lagret" : "Lagre bil";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors min-h-[44px]",
          saved
            ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/15"
            : "bg-background/40 border-border/40 text-foreground/80 hover:bg-background/60 hover:border-border",
          className,
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors min-h-[44px] min-w-[44px]",
        saved ? "text-primary" : "text-foreground/60 hover:text-foreground",
        className,
      )}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
    </button>
  );
}
