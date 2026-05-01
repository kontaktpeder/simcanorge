import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Eye } from "lucide-react";
import { useSpotCar } from "@/hooks/useSpotCar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { FEATURES } from "@/config/features";

interface SpotCarDialogProps {
  trigger?: React.ReactNode;
  onSpotted?: (carId: string) => void;
}

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function SpotCarDialog({ trigger, onSpotted }: SpotCarDialogProps) {
  if (!FEATURES.spotting) return null;
  return <SpotCarDialogInner trigger={trigger} onSpotted={onSpotted} />;
}

function SpotCarDialogInner({ trigger, onSpotted }: SpotCarDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { spotCar, isSubmitting } = useSpotCar();
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [regnr, setRegnr] = useState("");
  const [titleOrModel, setTitleOrModel] = useState("");
  const [note, setNote] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    const result = await spotCar({
      imageFile,
      registrationNumber: regnr.trim() || undefined,
      titleOrModel: titleOrModel.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (result) {
      setOpen(false);
      setImageFile(null);
      setRegnr("");
      setTitleOrModel("");
      setNote("");
      onSpotted?.(result.carId);
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.06] text-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider min-h-[44px] hover:bg-primary/10 transition-colors"
      style={oswald}
    >
      <Eye className="h-4 w-4" />
      Spot bil
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={oswald} className="uppercase tracking-wider">
            Spot bil
          </DialogTitle>
          <DialogDescription>
            Del en bil du har sett i dag. Registreringsnummer vises ikke offentlig.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="spot-image">
              Bilde <span className="text-destructive">*</span>
            </Label>
            <label
              htmlFor="spot-image"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-6 cursor-pointer hover:border-primary/40 transition-colors min-h-[120px]"
            >
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {imageFile ? imageFile.name : "Trykk for å velge bilde"}
              </span>
            </label>
            <input
              id="spot-image"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="spot-regnr">Registreringsnummer (valgfritt)</Label>
            <Input
              id="spot-regnr"
              value={regnr}
              onChange={(e) => setRegnr(e.target.value.toUpperCase())}
              placeholder="AB12345"
              autoCapitalize="characters"
              className="min-h-[44px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Vises aldri offentlig — brukes kun for å matche eksisterende bil.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="spot-title">Modell / tittel (valgfritt)</Label>
            <Input
              id="spot-title"
              value={titleOrModel}
              onChange={(e) => setTitleOrModel(e.target.value)}
              placeholder="F.eks. Volvo 240"
              className="min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="spot-note">Notat (valgfritt)</Label>
            <Textarea
              id="spot-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Hvor så du den? Hva fanget oppmerksomheten?"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={!imageFile || isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-bold uppercase tracking-wider min-h-[48px] hover:bg-primary/90 transition-colors disabled:opacity-50"
            style={oswald}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Spot bil
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
