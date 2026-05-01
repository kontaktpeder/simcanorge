import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, ImagePlus, Check, Compass, Pencil, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface Props {
  carId: string;
  carSlug: string;
  carTitle: string;
  firstImageUrl: string | null;
  /** Hvis bilen ikke har minst ett bilde + merke + modell, kan vi ikke publisere ennå. */
  canPublish: boolean;
  /** Lukker overlayet uten å gjøre noe — defaulter til "Rediger mer". */
  onClose: () => void;
}

export function PostCreateActionOverlay({
  carId,
  carSlug,
  carTitle,
  firstImageUrl,
  canPublish,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);

  const goToDashboard = () => navigate(`/dashboard/bil/${carId}`);
  // "Legg til bilde" sender brukeren rett inn i bil-redigering der de kan laste opp.
  const goAddImage = () => navigate(`/dashboard/bil/${carId}?focus=images`);

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("cars")
        .update({
          status: "published" as any,
          published_at: new Date().toISOString(),
        })
        .eq("id", carId);

      if (error) {
        toast.error(`Kunne ikke publisere: ${error.message}`);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["my-cars"] });
      queryClient.invalidateQueries({ queryKey: ["my-car", carId] });
      toast.success("Bilen er live! 🎉");
      navigate(carSlug ? `/biler/${carSlug}` : `/dashboard/bil/${carId}`);
    } catch {
      toast.error("Uventet feil ved publisering");
    } finally {
      setIsPublishing(false);
    }
  };

  // Onboarding-progress: 1) Bil opprettet ✓  2) Legg til bilde  3) Publiser
  const hasImage = !!firstImageUrl;
  const stepsDone = 1 + (hasImage ? 1 : 0);
  const totalSteps = 3;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop — klikk = rediger mer */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)",
        }}
      >
        {/* Accent line */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #34eab8 30%, #2dd4a8 50%, #34eab8 70%, transparent 100%)",
            opacity: 0.7,
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 400px 250px at 50% 0%, rgba(45,212,168,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Close (= rediger mer) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-white/70 transition-colors z-20"
          aria-label="Lukk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card */}
        <div
          className="relative rounded-2xl border border-border/60 m-3 sm:m-4 mt-5 p-4 sm:p-6"
          style={{
            background:
              "linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)",
          }}
        >
          {/* Hero preview */}
          {firstImageUrl && (
            <div className="relative mb-4 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 overflow-hidden rounded-t-2xl">
              <img
                src={firstImageUrl}
                alt={carTitle}
                className="w-full h-36 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(215,25%,11%)] via-transparent to-transparent" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#34eab8]" />
            <p
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{
                ...oswald,
                fontWeight: 500,
                background: "linear-gradient(135deg, #34eab8, #2dd4a8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Bra jobba — bilen er lagret
            </p>
          </div>
          <h2
            className="text-xl sm:text-2xl uppercase tracking-wide text-foreground font-bold italic mb-1 leading-tight"
            style={chakra}
          >
            {canPublish
              ? "Klar til å publisere?"
              : "Ett siste steg igjen"}
          </h2>
          <p className="text-[13px] text-muted-foreground mb-4" style={oswald}>
            {carTitle} ligger i garasjen din.{" "}
            {canPublish
              ? "Trykk publiser for å la andre se den."
              : "Legg til ett bilde, så er den klar."}
          </p>

          {/* Progress: Steg X av 3 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] tracking-[0.2em] uppercase text-white/50"
                style={oswald}
              >
                Steg {stepsDone} av {totalSteps}
              </span>
              <span
                className="text-[10px] tracking-[0.15em] uppercase text-[#34eab8]/80"
                style={oswald}
              >
                {canPublish ? "Nesten i mål" : "På god vei"}
              </span>
            </div>
            <div className="flex gap-1.5 mb-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    background:
                      i < stepsDone
                        ? "linear-gradient(90deg, #34eab8, #2dd4a8)"
                        : "rgba(255,255,255,0.08)",
                    boxShadow:
                      i < stepsDone ? "0 0 8px rgba(52,234,184,0.4)" : "none",
                  }}
                />
              ))}
            </div>

            <ul className="space-y-1.5">
              <ChecklistItem done label="Bil opprettet" />
              <ChecklistItem done={hasImage} label="Legg til bilde" />
              <ChecklistItem done={false} label="Publiser bilen" />
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* PRIMARY: dynamisk basert på hva som mangler */}
            {!hasImage ? (
              <Button
                onClick={goAddImage}
                className="w-full h-14 justify-start gap-3 text-[13px] uppercase tracking-[0.12em] font-semibold"
                style={{
                  ...chakra,
                  background:
                    "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)",
                  color: "#070b10",
                  boxShadow: "0 0 24px rgba(52,234,184,0.25)",
                }}
              >
                <ImagePlus className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span>Legg til bilde →</span>
                  <span
                    className="text-[10px] tracking-[0.05em] normal-case font-normal opacity-75"
                    style={oswald}
                  >
                    Trengs før andre kan se bilen
                  </span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className="w-full h-14 justify-start gap-3 text-[13px] uppercase tracking-[0.12em] font-semibold disabled:opacity-50"
                style={{
                  ...chakra,
                  background: canPublish
                    ? "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)"
                    : "linear-gradient(135deg, #1a2a26 0%, #131e1b 100%)",
                  color: canPublish ? "#070b10" : "#5a6b66",
                  boxShadow: canPublish
                    ? "0 0 24px rgba(52,234,184,0.25)"
                    : "none",
                }}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <div className="flex flex-col items-start">
                  <span>Publiser nå →</span>
                  <span
                    className="text-[10px] tracking-[0.05em] normal-case font-normal opacity-75"
                    style={oswald}
                  >
                    {canPublish
                      ? "Du kan alltid skjule den igjen"
                      : "Trenger merke og modell"}
                  </span>
                </div>
              </Button>
            )}

            {/* SECONDARY: Rediger detaljer */}
            <Button
              onClick={goToDashboard}
              variant="outline"
              className="w-full h-12 justify-start gap-3 text-[12px] uppercase tracking-[0.12em] font-semibold border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
              style={chakra}
            >
              <Pencil className="w-4 h-4" />
              Rediger detaljer
            </Button>

            {/* TERTIARY: Explore */}
            <button
              onClick={() => navigate("/biler")}
              className="w-full h-10 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.12em] font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={chakra}
            >
              <Compass className="w-3.5 h-3.5" />
              Utforsk Bilgarasjen
            </button>
          </div>
        </div>

        <div className="h-3" />
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-[12px]" style={oswald}>
      <span
        className="flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
        style={{
          background: done
            ? "linear-gradient(135deg, #34eab8, #2ab89a)"
            : "rgba(255,255,255,0.06)",
          border: done ? "none" : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {done && <Check className="w-2.5 h-2.5 text-[#070b10]" strokeWidth={3} />}
      </span>
      <span className={done ? "text-white/85 line-through decoration-white/30" : "text-white/60"}>
        {label}
      </span>
    </li>
  );
}
