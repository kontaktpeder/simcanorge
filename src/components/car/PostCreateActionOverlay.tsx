import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, Pencil, Compass, Eye, EyeOff, Loader2 } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop — klikk = rediger mer */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto"
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
          className="absolute top-4 right-4 p-1.5 text-white/30 hover:text-white/70 transition-colors z-20"
          aria-label="Lukk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card */}
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
            Bilen er lagret
          </p>
          <h2
            className="text-2xl sm:text-3xl uppercase tracking-wide text-foreground font-bold italic mb-2"
            style={chakra}
          >
            Hva vil du nå?
          </h2>
          <p className="text-sm text-muted-foreground mb-5" style={oswald}>
            {carTitle} ligger trygt i garasjen din.
          </p>

          {/* Status-stripe */}
          <div className="space-y-2 mb-5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 text-[12px]">
              <Eye className="w-4 h-4 text-emerald-400/80 flex-shrink-0" />
              <span className="text-white/70">Bilen er synlig i din garasje</span>
            </div>
            <div className="flex items-center gap-2.5 text-[12px]">
              <EyeOff className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
              <span className="text-white/70">Den er ikke synlig for andre ennå</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {/* PRIMARY: Publish */}
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
                <span>Publiser nå – la andre se den</span>
                <span
                  className="text-[10px] tracking-[0.05em] normal-case font-normal opacity-70"
                  style={oswald}
                >
                  {canPublish
                    ? "Du kan alltid skjule den igjen"
                    : "Trenger minst ett bilde + merke og modell"}
                </span>
              </div>
            </Button>

            {/* SECONDARY: Edit more */}
            <Button
              onClick={goToDashboard}
              variant="outline"
              className="w-full h-14 justify-start gap-3 text-[13px] uppercase tracking-[0.12em] font-semibold border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
              style={chakra}
            >
              <Pencil className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span>Rediger mer først</span>
                <span
                  className="text-[10px] tracking-[0.05em] normal-case font-normal opacity-60"
                  style={oswald}
                >
                  Legg til historie, flere bilder, eller endre detaljer
                </span>
              </div>
            </Button>

            {/* TERTIARY: Explore */}
            <button
              onClick={() => navigate("/biler")}
              className="w-full h-12 flex items-center justify-center gap-2 text-[12px] uppercase tracking-[0.12em] font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={chakra}
            >
              <Compass className="w-4 h-4" />
              Utforsk Bilgarasjen
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
