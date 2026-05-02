import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface IdentifyCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carTitle: string;
}

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function IdentifyCarDialog({ open, onOpenChange, carId, carTitle }: IdentifyCarDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setBrand("");
    setModel("");
    setYear("");
    setYearFrom("");
    setYearTo("");
    setComment("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!brand.trim() || !model.trim()) {
      toast.error("Merke og modell er påkrevd");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_car_identification_suggestion", {
        p_car_id: carId,
        p_brand: brand.trim(),
        p_model: model.trim(),
        p_year: year ? parseInt(year, 10) : null,
        p_year_from: yearFrom ? parseInt(yearFrom, 10) : null,
        p_year_to: yearTo ? parseInt(yearTo, 10) : null,
        p_comment: comment.trim() || null,
      });
      if (error) throw error;
      const result = data as { ok: boolean; error?: string } | null;
      if (!result?.ok) {
        toast.error(result?.error === "not_authenticated" ? "Du må være innlogget" : "Kunne ikke sende forslag");
        return;
      }
      toast.success("Takk! Du hjalp til med å identifisere bilen.");
      queryClient.invalidateQueries({ queryKey: ["unknown-cars"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("identify suggestion error", err);
      toast.error("Kunne ikke sende forslag");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={oswald} className="uppercase tracking-wider">
            Vet du hva dette er?
          </DialogTitle>
          <DialogDescription>
            Foreslå merke og modell for «{carTitle}». Forslaget går til vurdering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ident-brand">
                Merke <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ident-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="F.eks. Volvo"
                className="min-h-[44px]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ident-model">
                Modell <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ident-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="F.eks. 240"
                className="min-h-[44px]"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ident-year">År (valgfritt)</Label>
            <Input
              id="ident-year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="F.eks. 1985"
              className="min-h-[44px]"
              min={1900}
              max={new Date().getFullYear() + 1}
            />
            <p className="text-[11px] text-muted-foreground">Eller angi et intervall:</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="numeric"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="Fra"
                className="min-h-[44px]"
                min={1900}
                max={new Date().getFullYear() + 1}
              />
              <Input
                type="number"
                inputMode="numeric"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="Til"
                className="min-h-[44px]"
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ident-comment">Kommentar (valgfritt)</Label>
            <Textarea
              id="ident-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hva fikk deg til å gjenkjenne den?"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting} className="min-h-[48px]">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Send forslag
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
