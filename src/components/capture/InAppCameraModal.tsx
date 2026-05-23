import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, RefreshCw, Images, Check } from "lucide-react";

// Vegvesen-lys palett — matcher Header, BottomNav og resten av appen
const VV_YELLOW = "#fcc419";
const VV_DARK = "#2b2b2b";
const inter = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  /** Åpner systemets bildevelger direkte (ingen mellomvalg). */
  onPickGallery?: () => void;
}

/**
 * Lys, museums-inspirert kamera-UI. Bruker getUserMedia for live preview.
 * Galleri-knappen åpner systemets bildevelger direkte — ingen mellomdialog.
 */
export function InAppCameraModal({ open, onClose, onCapture, onPickGallery }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startStream = useCallback(async (mode: "environment" | "user") => {
    setError(null);
    setStarting(true);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kameratilgang feilet";
      setError(
        /denied|NotAllowed/i.test(msg)
          ? "Kameratilgang ble avslått. Tillat kamera i nettleseren, eller velg fra bilder."
          : "Klarte ikke å starte kameraet. Prøv å velge fra bilder."
      );
    } finally {
      setStarting(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (open && !previewUrl) {
      void startStream(facing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  useEffect(() => {
    if (open && !previewUrl && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [open, previewUrl, starting]);

  useEffect(() => {
    if (!open) stopStream();
  }, [open, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleClose() {
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
    onClose();
  }

  async function handleShoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.92)
    );
    if (!blob) return;
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    setPreviewFile(file);
    setPreviewUrl(url);
    stopStream();
  }

  function handleRetake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
    void startStream(facing);
  }

  function handleAccept() {
    if (!previewFile) return;
    const file = previewFile;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
    stopStream();
    onCapture(file);
  }

  function handleFlip() {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  }

  function handleGalleryDirect() {
    // Åpner systemets bildevelger direkte — ingen mellomvalg
    stopStream();
    onPickGallery?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-label="Kamera"
      style={{ background: "#f3f3f3" }}
    >
      {/* Top bar — hvit, museums-stil */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-3 bg-white"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors"
          aria-label="Lukk kamera"
        >
          <X className="w-5 h-5" strokeWidth={2.25} />
        </button>
        <div aria-hidden className="w-10" />
      </div>

      {/* Viewport — sort innramming på lys bakgrunn */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center p-3">
        <div
          className="relative w-full h-full overflow-hidden bg-black rounded-2xl"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Forhåndsvisning"
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
            />
          )}

          {error && (
            <div
              className="absolute inset-x-4 top-4 rounded-lg p-3 text-[12px] text-neutral-900"
              style={{
                ...inter,
                background: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Kontroll-panel — hvit, kortbasert */}
      <div
        className="px-6 pt-5 pb-6 bg-white"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {previewUrl ? (
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              type="button"
              onClick={handleRetake}
              className="px-5 py-3 rounded-full text-[12px] uppercase tracking-[0.14em] font-bold text-neutral-900 hover:bg-neutral-100 transition-colors"
              style={{ ...inter, border: "1px solid rgba(0,0,0,0.12)" }}
            >
              Ta nytt
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="w-16 h-16 rounded-full flex items-center justify-center text-neutral-900 hover:scale-[1.04] active:scale-[0.97] transition"
              style={{
                background: VV_YELLOW,
                boxShadow: "0 6px 20px rgba(252,196,25,0.45), inset 0 1px 0 rgba(255,255,255,0.6)",
                border: `2px solid ${VV_DARK}`,
              }}
              aria-label="Bruk bilde"
            >
              <Check className="w-7 h-7" strokeWidth={2.75} />
            </button>
            <div className="w-[88px]" aria-hidden />
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              type="button"
              onClick={handleGalleryDirect}
              className="flex flex-col items-center gap-1 group"
              aria-label="Velg fra bilder"
            >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-800 transition-colors group-hover:bg-neutral-100"
                style={{ border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <Images className="w-5 h-5" strokeWidth={2.25} />
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.12em] font-bold text-neutral-500"
                style={inter}
              >
                Bibliotek
              </span>
            </button>

            <button
              type="button"
              onClick={handleShoot}
              disabled={!!error || starting}
              className="w-[82px] h-[82px] rounded-full flex items-center justify-center disabled:opacity-40 hover:scale-[1.03] active:scale-[0.96] transition"
              style={{
                background: "#ffffff",
                border: `4px solid ${VV_DARK}`,
                boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
              }}
              aria-label="Ta bilde"
            >
              <span
                className="block w-[58px] h-[58px] rounded-full flex items-center justify-center"
                style={{
                  background: VV_YELLOW,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
                }}
              >
                <Camera className="w-6 h-6 text-neutral-900" strokeWidth={2.5} />
              </span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              disabled={starting}
              className="flex flex-col items-center gap-1 group disabled:opacity-30"
              aria-label="Snu kamera"
            >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-800 transition-colors group-hover:bg-neutral-100"
                style={{ border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <RefreshCw className="w-5 h-5" strokeWidth={2.25} />
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.12em] font-bold text-neutral-500"
                style={inter}
              >
                Snu
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
