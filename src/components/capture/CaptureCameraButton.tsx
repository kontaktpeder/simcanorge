import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { SpotCarDialog } from "@/components/car/SpotCarDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface Props {
  /** "hero" = stor rund knapp på Start, "fab" = 64px senter i BottomNav. */
  size?: "hero" | "fab";
  /** Valgfri tilbakemelding når dialog opnar/lukkar (brukt av BottomNav for visibility). */
  onOpenChange?: (open: boolean) => void;
  /** Skjermkontekst for analytics. */
  screen?: string;
}

/**
 * Capture-first inngang: éin stor kameraknapp som opnar systemkamera/filvelger
 * og sender bildet direkte inn i SpotCarDialog (controlled, initialImageFile).
 *
 * Brukes både frå Start (hero) og BottomNav (fab) slik at "Fang bil" er
 * éin og same flyt overalt.
 */
export function CaptureCameraButton({ size = "hero", onOpenChange, screen }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prefillFile, setPrefillFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    void track("capture_intent_click", screen ?? "start", { path: location.pathname });
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    inputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // tillat samme fil igjen
    if (!file) return;
    setPrefillFile(file);
    setDialogOpen(true);
    onOpenChange?.(true);
  };

  const handleOpenChange = (next: boolean) => {
    setDialogOpen(next);
    onOpenChange?.(next);
    if (!next) setPrefillFile(null);
  };

  const isHero = size === "hero";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {isHero ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Fang bil"
          className="group relative flex flex-col items-center gap-3 active:scale-[0.97] transition-transform"
        >
          <span
            className="w-[132px] h-[132px] rounded-full flex items-center justify-center transition-all group-hover:scale-[1.03]"
            style={{
              background:
                "linear-gradient(135deg, #34eab8 0%, #2ab89a 55%, #1cb896 100%)",
              boxShadow:
                "0 0 48px rgba(52,234,184,0.45), 0 12px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
              border: "4px solid rgba(8,12,17,0.95)",
            }}
          >
            <Camera className="w-12 h-12 text-[#070b10]" strokeWidth={2.25} />
          </span>
          <span
            className="text-[12px] uppercase tracking-[0.18em] font-bold text-white/85"
            style={chakra}
          >
            Fang bil
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Fang bil"
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-[1.04] active:scale-[0.97]"
          style={{
            background:
              "linear-gradient(135deg, #34eab8 0%, #2ab89a 60%, #1cb896 100%)",
            boxShadow:
              "0 0 28px rgba(52,234,184,0.45), 0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
            border: "3px solid rgba(8,12,17,0.95)",
          }}
        >
          <Camera className="w-6 h-6 text-[#070b10]" strokeWidth={2.5} />
        </button>
      )}

      <SpotCarDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        initialImageFile={prefillFile}
      />
    </>
  );
}
