import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { useActivityMoments } from "@/hooks/useActivityMoments";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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

  const reset = () => {
    setImageFile(null);
    setNote("");
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
    if (!imageFile && !note.trim()) return;
    await addMoment({ sessionId, imageFile, note: note.trim() || null });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
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
              disabled={isAdding || (!imageFile && !note.trim())}
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
