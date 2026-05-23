import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Images } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";
import { usePublishComposer } from "@/contexts/PublishComposerContext";
import { InAppCameraModal } from "@/components/capture/InAppCameraModal";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

function supportsInAppCamera() {
  return typeof navigator !== "undefined"
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === "function"
    && (typeof window === "undefined" || window.isSecureContext !== false);
}

interface Props {
  /** "hero" = stor rund knapp på Start, "fab" = 64px senter i BottomNav. */
  size?: "hero" | "fab";
  /** Valgfri tilbakemelding når dialog opnar/lukkar (brukt av BottomNav for visibility). */
  onOpenChange?: (open: boolean) => void;
  /** Skjermkontekst for analytics. */
  screen?: string;
  /** Light = museumspalett, dark = standard mørk. */
  variant?: "dark" | "light";
}

/**
 * Capture-first inngang: éin stor kameraknapp som opnar systemkamera/filvelger
 * og sender bildet direkte inn i SpotCarDialog (controlled, initialImageFile).
 *
 * Brukes både frå Start (hero) og BottomNav (fab) slik at "Fang bil" er
 * éin og same flyt overalt.
 */
export function CaptureCameraButton({ size = "hero", onOpenChange, screen, variant = "dark" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const { openPublishComposer } = usePublishComposer();
  const inAppCamera = supportsInAppCamera();

  const isLight = variant === "light";

  const requireAuth = () => {
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  const handleClick = () => {
    void track("capture_intent_click", screen ?? "start", { path: location.pathname, source: "camera" });
    if (!requireAuth()) return;
    if (inAppCamera) {
      setCameraOpen(true);
      onOpenChange?.(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleGalleryClick = () => {
    void track("capture_intent_click", screen ?? "start", { path: location.pathname, source: "gallery" });
    if (!requireAuth()) return;
    galleryRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // tillat samme fil igjen
    if (!file) return;
    openPublishComposer({
      initialImageFile: file,
      source: screen ?? "capture",
    });
    onOpenChange?.(true);
  };

  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    openPublishComposer({ initialImageFile: file, source: screen ?? "capture" });
    onOpenChange?.(true);
  };

  const handleCameraClose = () => {
    setCameraOpen(false);
    onOpenChange?.(false);
  };

  const handleCameraGalleryFallback = () => {
    setCameraOpen(false);
    galleryRef.current?.click();
  };

  const isHero = size === "hero";

  const heroCircleStyle: React.CSSProperties = isLight
    ? {
        background: "linear-gradient(135deg, #3d6b5e 0%, #2c5c50 55%, #1f3a34 100%)",
        boxShadow: "0 0 32px rgba(31,58,52,0.25), 0 8px 24px rgba(0,0,0, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        border: "4px solid rgba(233,231,225,0.95)",
      }
    : {
        background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 55%, #1cb896 100%)",
        boxShadow: "0 0 48px rgba(52,234,184,0.45), 0 12px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
        border: "4px solid rgba(8,12,17,0.95)",
      };

  const fabCircleStyle: React.CSSProperties = isLight
    ? {
        background: "#4a5560",
        boxShadow: "0 6px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
        border: "3px solid #ffffff",
      }
    : {
        background: "#4a5560",
        boxShadow: "0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        border: "3px solid rgba(255,255,255,0.95)",
      };

  const iconColor = "#ffffff";


  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {isHero ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleClick}
            aria-label="Fang bil"
            className="group relative flex flex-col items-center gap-3 active:scale-[0.97] transition-transform"
          >
            <span
              className="w-[132px] h-[132px] rounded-full flex items-center justify-center transition-all group-hover:scale-[1.03]"
              style={heroCircleStyle}
            >
              <Camera className="w-12 h-12" style={{ color: iconColor }} strokeWidth={2.25} />
            </span>
            <span
              className="text-[12px] uppercase tracking-[0.18em] font-bold text-white/85"
              style={chakra}
            >
              Fang bil
            </span>
          </button>
          <button
            type="button"
            onClick={handleGalleryClick}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/45 hover:text-white/85 transition-colors py-1.5 px-2"
            style={chakra}
          >
            <Images className="w-3.5 h-3.5" />
            Velg fra bilder
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Fang bil"
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-[1.04] active:scale-[0.97]"
          style={fabCircleStyle}
        >
          <Camera className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2.5} />
        </button>
      )}

      {!useV1 && (
        <SpotCarDialog
          open={dialogOpen}
          onOpenChange={handleOpenChange}
          initialImageFile={prefillFile}
        />
      )}

      {cameraOpen && typeof document !== "undefined" &&
        createPortal(
          <InAppCameraModal
            open={cameraOpen}
            onClose={handleCameraClose}
            onCapture={handleCameraCapture}
            onPickGallery={handleCameraGalleryFallback}
          />,
          document.body,
        )}
    </>
  );
}
