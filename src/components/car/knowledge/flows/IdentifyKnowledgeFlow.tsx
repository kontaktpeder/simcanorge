import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  carId: string;
  onDone: () => void;
}

export function IdentifyKnowledgeFlow({ carId, onDone }: Props) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onDone();
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
      toast.success("Takk for bidraget!");
      queryClient.invalidateQueries({ queryKey: ["unknown-cars"] });
      onDone();
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke sende forslag");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ik-brand">Merke <span className="text-destructive">*</span></Label>
          <Input id="ik-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="F.eks. Volvo" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ik-model">Modell <span className="text-destructive">*</span></Label>
          <Input id="ik-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="F.eks. 240" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ik-year">År (valgfritt)</Label>
        <Input id="ik-year" type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="F.eks. 1985" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input type="number" inputMode="numeric" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="Fra" />
          <Input type="number" inputMode="numeric" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="Til" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ik-comment">Kommentar (valgfritt)</Label>
        <Textarea id="ik-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Hva fikk deg til å gjenkjenne den?" />
      </div>
      <Button type="submit" disabled={submitting} className="w-full min-h-[48px]">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send forslag"}
      </Button>
    </form>
  );
}
