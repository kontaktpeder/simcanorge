import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X, Car as CarIcon, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface CarMatch {
  id: string;
  slug: string | null;
  title: string;
  published_at: string | null;
}

function normalizeRegnr(regnr: string): string {
  return regnr.toLowerCase().replace(/\s|-/g, "").trim();
}

export function AddMomentDialog({
  sessionId,
  open,
  onOpenChange,
}: {
  sessionId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addMoment, isAdding } = useActivityMoments(sessionId);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [regnr, setRegnr] = useState("");
  const [match, setMatch] = useState<CarMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [relOpen, setRelOpen] = useState(false);

  // Debounced regnr lookup (samme som i SpotCarDialog)
  useEffect(() => {
    const normalized = normalizeRegnr(regnr);
    if (normalized.length < 2) {
      setMatch(null);
      setIsLookingUp(false);
      return;
    }
    let cancelled = false;
    setIsLookingUp(true);
    const handle = window.setTimeout(async () => {
      const { data } = await supabase.rpc(
        "find_cars_by_registration_number" as never,
        { p_normalized: normalized } as never,
      );
      if (cancelled) return;
      const list = Array.isArray(data) ? (data as CarMatch[]) : [];
      setMatch(list.length > 0 ? list[0] : null);
      setIsLookingUp(false);
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      setIsLookingUp(false);
    };
  }, [regnr]);

  const reset = () => {
    setImageFile(null);
    setNote("");
    setRegnr("");
    setMatch(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFile = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setImageFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile && !note.trim() && !regnr.trim()) return;
    await addMoment({
      sessionId,
      imageFile,
      note: note.trim() || null,
      registrationNumber: regnr.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="border-white/10 max-h-[90vh] overflow-y-auto" style={{ background: "hsl(215 25% 10%)" }}>
        <DialogHeader>
          <DialogTitle className="text-white" style={chakra}>Legg til øyeblikk</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {previewUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img src={previewUrl} alt="" className="w-full max-h-72 object-cover" />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-dashed border-white/15 hover:border-[#2dd4a8]/40 transition-all cursor-pointer"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <Camera className="w-6 h-6 text-[#2dd4a8]" />
              <span className="text-[12px] text-white/60 uppercase tracking-[0.1em]" style={oswald}>Ta / velg bilde</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <div>
            <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>
              Regnr (valgfri)
            </Label>
            <div className="mt-1.5">
              <LicensePlateInput value={regnr} onChange={setRegnr} />
            </div>
            <p className="text-[10px] text-white/30 mt-1.5" style={oswald}>
              Kobles til bil i garasjen. Vises aldri offentlig.
            </p>
          </div>

          {isLookingUp && (
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Søker etter bil…
            </div>
          )}
          {!isLookingUp && match && (
            <div className="rounded-lg border border-[#2dd4a8]/30 bg-[#2dd4a8]/[0.06] p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[#2dd4a8]/10 p-1.5 text-[#2dd4a8]">
                  <CarIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#2dd4a8]/80" style={oswald}>
                    Denne bilen finnes allerede
                  </p>
                  <p className="text-[13px] font-semibold text-white truncate" style={chakra}>
                    {match.title}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setRelOpen(true)}
                    className="mt-2 bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8] h-8"
                  >
                    <Link2 className="mr-1.5 h-3 w-3" />
                    Jeg har forhold til denne bilen
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Textarea
            placeholder="Notat (valgfri)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/60 hover:text-white"
            >
              Avbryt
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isAdding || (!imageFile && !note.trim() && !regnr.trim())}
              className="bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8]"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lagre øyeblikk"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
