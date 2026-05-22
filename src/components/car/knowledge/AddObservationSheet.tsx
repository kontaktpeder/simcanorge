import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus } from "lucide-react";
import { useAddCarObservation } from "@/hooks/useAddCarObservation";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carSlug?: string | null;
  onSuccess?: () => void;
}

export function AddObservationSheet({ open, onOpenChange, carId, carSlug, onSuccess }: Props) {
  const { addObservation, isSubmitting } = useAddCarObservation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reset = () => {
    setFile(null);
    setPreview(null);
    setNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Velg et bilde først");
      return;
    }
    const result = await addObservation({ carId, imageFile: file, note });
    if (result) {
      toast.success("Den er med nå.");
      reset();
      onOpenChange(false);
      onSuccess?.();
      if (result.slug) navigate(`/biler/${result.slug}?observed=1`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent
        side="bottom"
        className="bg-[#070b10] text-white border-t border-white/10 rounded-t-2xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-white font-display text-xl">Legg til et bilde</SheetTitle>
          <SheetDescription className="text-white/60">
            En ny observasjon på denne bilen.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5"
            >
              <img src={preview} alt="Forhåndsvisning" className="w-full h-full object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-2 text-white/70 hover:bg-white/10 transition"
            >
              <ImagePlus className="w-7 h-7" />
              <span className="text-sm">Velg bilde</span>
            </button>
          )}

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="Hvor så du den? (valgfritt)"
            rows={3}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/40"
          />

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
            className="w-full min-h-[48px] bg-[#34eab8] text-[#070b10] hover:bg-[#2dd4a8] font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send inn"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
