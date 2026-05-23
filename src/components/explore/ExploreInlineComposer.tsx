import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { usePublishComposer } from "@/contexts/PublishComposerContext";
import { InAppCameraModal } from "@/components/capture/InAppCameraModal";
import { track } from "@/lib/analytics";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const inter = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" } as const;

const MAX_LEN = 500;

function supportsInAppCamera() {
  return typeof navigator !== "undefined"
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === "function"
    && (typeof window === "undefined" || window.isSecureContext !== false);
}

export function ExploreInlineComposer({ light = false }: { light?: boolean }) {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const { mutateAsync, isPending } = useCreateFeedPost();
  const { openPublishComposer } = usePublishComposer();
  const navigate = useNavigate();
  const location = useLocation();

  const [textMode, setTextMode] = useState(false);
  const [body, setBody] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [prefillFile, setPrefillFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useV1 = FEATURES.publishComposerV1;
  const inAppCamera = supportsInAppCamera();

  async function handlePublish() {
    const t = body.trim();
    if (!t) return;
    try {
      await mutateAsync({ post_type: "manual", body: t });
      setBody("");
      setTextMode(false);
      toast.success("Publisert i Utforsk");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  function handleCancelText() {
    setBody("");
    setTextMode(false);
  }

  function handleCameraClick() {
    void track("capture_intent_click", "explore_inline", { path: location.pathname, source: "camera" });
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (inAppCamera) {
      setCameraOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  }

  function routeFile(file: File) {
    if (useV1) {
      openPublishComposer({ initialImageFile: file, source: "explore_inline" });
    } else {
      setPrefillFile(file);
      setFallbackOpen(true);
    }
  }

  function handleCameraCapture(file: File) {
    setCameraOpen(false);
    routeFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (f) routeFile(f);
  }

  // ── Theme tokens ──
  const containerCls = light
    ? "rounded-2xl border bg-white"
    : "rounded-xl border border-white/[0.10] bg-white/[0.03]";
  const containerStyle = light ? { borderColor: "rgba(0,0,0,0.08)" } : undefined;
  const placeholderCls = light ? "text-neutral-500" : "text-white/45";
  const dividerCls = light ? "bg-black/[0.08]" : "bg-white/[0.08]";
  const camBtnCls = light
    ? "shrink-0 px-3.5 hover:bg-black/[0.04] text-[#ff8a00] transition-colors rounded-r-2xl flex items-center"
    : "shrink-0 px-3.5 hover:bg-white/[0.06] text-[#2dd4a8] transition-colors rounded-r-xl flex items-center";
  const textBtnCls = light
    ? "flex-1 text-left px-3 py-3 hover:bg-black/[0.03] transition-colors rounded-l-2xl"
    : "flex-1 text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors rounded-l-xl";
  const fontStyle = light ? inter : chakra;
  const textareaCls = light
    ? "w-full resize-none bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none leading-snug"
    : "w-full resize-none bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none leading-snug";
  const cancelCls = light
    ? "px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-bold text-neutral-500 hover:text-neutral-900"
    : "px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-bold text-white/40 hover:text-white/70";
  const publishStyle = light
    ? { ...inter, background: "#2b2b2b", color: "#fcc419" }
    : { ...chakra, background: "linear-gradient(135deg, #34eab8, #2dd4a8)" };
  const publishCls = light
    ? "px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] font-bold disabled:opacity-30 transition hover:brightness-105"
    : "px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.12em] font-bold text-[#070b10] disabled:opacity-30 transition hover:brightness-110";
  const profileLabelCls = light ? "text-[10px] text-neutral-400 truncate max-w-[50%]" : "text-[10px] text-white/25 truncate max-w-[50%]";

  if (!user) {
    return (
      <Link
        to="/login?returnUrl=/hjem"
        className={
          light
            ? "flex items-center justify-between gap-2 rounded-2xl border bg-white px-3 py-3 hover:bg-black/[0.02] transition-colors"
            : "flex items-center justify-between gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
        }
        style={containerStyle}
      >
        <span className={`text-[13px] truncate ${placeholderCls}`} style={fontStyle}>
          Hva har du sett i dag?
        </span>
        <span
          className={
            light
              ? "shrink-0 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] font-bold"
              : "shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-bold text-[#2dd4a8]"
          }
          style={
            light
              ? { ...inter, background: "#2b2b2b", color: "#fcc419" }
              : fontStyle
          }
        >
          Logg inn
        </span>
      </Link>
    );
  }

  return (
    <div className={containerCls} style={containerStyle}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />

      {!textMode ? (
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setTextMode(true)}
            className={textBtnCls}
          >
            <span className={`text-[13px] ${placeholderCls}`} style={fontStyle}>
              Hva har du sett i dag?
            </span>
          </button>
          <div className={`w-px ${dividerCls}`} />
          <button
            type="button"
            onClick={handleCameraClick}
            className={camBtnCls}
            aria-label="Åpne kamera"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-3 py-2.5">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
            placeholder="Skriv en oppdatering…"
            rows={3}
            maxLength={MAX_LEN}
            className={textareaCls}
            style={fontStyle}
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className={profileLabelCls} style={fontStyle}>
              {profile?.display_name ?? ""}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCancelText}
                className={cancelCls}
                style={fontStyle}
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={isPending || !body.trim()}
                className={publishCls}
                style={publishStyle}
              >
                {isPending ? "…" : "Publiser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraOpen && typeof document !== "undefined" &&
        createPortal(
          <InAppCameraModal
            open={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={handleCameraCapture}
            onPickGallery={() => {
              setCameraOpen(false);
              fileInputRef.current?.click();
            }}
          />,
          document.body,
        )}

      {!useV1 && (
        <SpotCarDialog
          open={fallbackOpen}
          onOpenChange={(next) => {
            setFallbackOpen(next);
            if (!next) setPrefillFile(null);
          }}
          initialImageFile={prefillFile}
        />
      )}
    </div>
  );
}
