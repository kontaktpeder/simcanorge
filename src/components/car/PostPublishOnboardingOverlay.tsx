import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Copy, Check, User, PlusCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface Props {
  carTitle: string;
  carSlug: string;
  carId: string;
  firstImageUrl: string | null;
  siteUrl: string;
  hasPersonProfile: boolean;
  onDismiss: () => void;
  onOpenComposer: () => void;
}

export function PostPublishOnboardingOverlay({
  carTitle,
  carSlug,
  carId,
  firstImageUrl,
  siteUrl,
  hasPersonProfile,
  onDismiss,
  onOpenComposer,
}: Props) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const fullUrl = `${siteUrl}/biler/${carSlug}`;

  const dismiss = () => {
    localStorage.setItem(`bilgarasje_post_publish_seen_${carId}`, "1");
    onDismiss();
  };

  const handleAction = (action: () => void) => {
    dismiss();
    action();
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Lenke kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunne ikke kopiere");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)",
        }}
      >
        {/* Accent line */}
        <div className="h-[2px] w-full" style={{
          background:
            "linear-gradient(90deg, transparent 0%, #34eab8 30%, #2dd4a8 50%, #34eab8 70%, transparent 100%)",
          opacity: 0.6,
        }} />

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 400px 250px at 50% 0%, rgba(45,212,168,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 text-white/30 hover:text-white/70 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content card */}
        <div
          className="relative rounded-2xl border border-border/60 m-4 mt-6 p-5 sm:p-7"
          style={{
            background:
              "linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)",
          }}
        >
          {/* Hero preview */}
          {firstImageUrl && (
            <div className="relative mb-5 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 overflow-hidden rounded-t-2xl">
              <img
                src={firstImageUrl}
                alt={carTitle}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(215,25%,11%)] via-transparent to-transparent" />
            </div>
          )}

          <p
            className="text-[10px] tracking-[0.3em] uppercase mb-1"
            style={{
              ...oswald,
              fontWeight: 500,
              background: "linear-gradient(135deg, #34eab8, #2dd4a8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Gratulerer
          </p>
          <h2
            className="text-2xl sm:text-3xl uppercase tracking-wide text-foreground font-bold italic mb-2"
            style={chakra}
          >
            Bilen din er live
          </h2>
          <p className="text-sm text-muted-foreground mb-4" style={oswald}>
            {carTitle} er nå synlig for alle
          </p>

          {/* URL copy row */}
          <button
            onClick={copyUrl}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-colors mb-6 group text-left"
          >
            <span
              className="flex-1 text-[13px] text-white/50 truncate font-mono"
            >
              {fullUrl}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
            )}
          </button>

          {/* Progress hint */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: "20%",
                  background: "linear-gradient(90deg, #34eab8, #2dd4a8)",
                }}
              />
            </div>
            <span className="text-[11px] text-white/30 font-sans">20 %</span>
          </div>

          <p
            className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3"
            style={oswald}
          >
            Neste steg
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => handleAction(() => navigate("/dashboard/min-profil"))}
              className="w-full h-12 justify-start gap-3 text-[12px] uppercase tracking-[0.12em] font-semibold"
              style={{
                ...chakra,
                background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)",
                color: "#070b10",
                boxShadow: "0 0 20px rgba(52,234,184,0.15)",
              }}
            >
              <User className="w-4 h-4" />
              Gjør den personlig
            </Button>

            <Button
              onClick={() => handleAction(() => navigate("/send-inn"))}
              variant="outline"
              className="w-full h-12 justify-start gap-3 text-[12px] uppercase tracking-[0.12em] font-semibold border-white/[0.10] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              style={chakra}
            >
              <PlusCircle className="w-4 h-4" />
              Legg til flere biler
            </Button>

            <Button
              onClick={() =>
                handleAction(() => {
                  if (hasPersonProfile) {
                    onOpenComposer();
                  } else {
                    navigate(
                      `/kom-i-gang?returnUrl=${encodeURIComponent(window.location.pathname)}`
                    );
                  }
                })
              }
              variant="outline"
              className="w-full h-12 justify-start gap-3 text-[12px] uppercase tracking-[0.12em] font-semibold border-white/[0.10] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              style={chakra}
            >
              <MessageSquare className="w-4 h-4" />
              Fortell noe om bilen
            </Button>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
