import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, RefreshCw, Images, Check } from "lucide-react";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  /** Lar bruker velge fra galleri i stedet */
  onPickGallery?: () => void;
}

/**
 * In-app camera UI using getUserMedia. Streams video into a <video> element,
 * captures a frame to a JPEG File, lets user accept/retake before passing on.
 * Falls back to the gallery picker if camera permission is denied.
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

  // Re-attach stream to <video> when element mounts after stream is ready
  useEffect(() => {
    if (open && !previewUrl && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [open, previewUrl, starting]);

  // Always stop tracks when modal closes or unmounts
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-label="Kamera">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white"
          aria-label="Lukk kamera"
        >
          <X className="w-5 h-5" />
        </button>
        <span
          className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/80"
          style={chakra}
        >
          Fang bil
        </span>
        <button
          type="button"
          onClick={handleFlip}
          disabled={!!previewUrl || starting}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white disabled:opacity-40"
          aria-label="Snu kamera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Viewport */}
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Forhåndsvisning" className="max-h-full max-w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          />
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-black/80 border border-white/15 p-3 text-[12px] text-white/90" style={chakra}>
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="px-6 pt-4 pb-6 bg-black"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        {previewUrl ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleRetake}
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-[12px] uppercase tracking-[0.14em] font-bold"
              style={chakra}
            >
              Ta nytt
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="w-16 h-16 rounded-full flex items-center justify-center text-[#070b10] hover:scale-[1.04] transition"
              style={{ background: "linear-gradient(135deg, #34eab8, #2dd4a8)", boxShadow: "0 0 24px rgba(52,234,184,0.4)" }}
              aria-label="Bruk bilde"
            >
              <Check className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <div className="w-[88px]" aria-hidden />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                stopStream();
                onPickGallery?.();
                onClose();
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white"
              aria-label="Velg fra bilder"
            >
              <Images className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleShoot}
              disabled={!!error || starting}
              className="w-[78px] h-[78px] rounded-full flex items-center justify-center bg-white text-black disabled:opacity-40 hover:scale-[1.03] active:scale-[0.97] transition"
              style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.18), 0 0 0 8px rgba(0,0,0,0.4) inset" }}
              aria-label="Ta bilde"
            >
              <span className="block w-[62px] h-[62px] rounded-full bg-white border-[3px] border-black/80">
                <Camera className="w-6 h-6 mx-auto mt-[15px] text-black/70" />
              </span>
            </button>
            <div className="w-12" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
