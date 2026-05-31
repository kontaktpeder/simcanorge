import { useMemo, useState } from "react";
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
import { useCarBrands, useCarModels } from "@/hooks/useCarCatalog";

interface Props {
  carId: string;
  onDone: () => void;
}

const OTHER = "__other__";

export function IdentifyKnowledgeFlow({ carId, onDone }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading: brandsLoading } = useCarBrands();
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brand, setBrand] = useState("");
  const [brandMode, setBrandMode] = useState<"select" | "other">("select");

  const { data: models = [], isLoading: modelsLoading } = useCarModels(brandId);
  const [model, setModel] = useState("");
  const [modelMode, setModelMode] = useState<"select" | "other">("select");

  const [year, setYear] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectClass = "w-full h-11 px-3 text-base rounded-md border bg-background";

  const handleBrandSelect = (value: string) => {
    if (value === OTHER) {
      setBrandMode("other");
      setBrand("");
      setBrandId(null);
      setModel("");
      return;
    }
    const b = brands.find(x => x.name === value);
    setBrand(b?.name ?? value);
    setBrandId(b?.id ?? null);
    setModel("");
    setModelMode("select");
  };

  const handleModelSelect = (value: string) => {
    if (value === OTHER) {
      setModelMode("other");
      setModel("");
      return;
    }
    const m = models.find(x => x.name === value);
    setModel(m?.name ?? value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onDone();
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const hasAny =
      brand.trim() || model.trim() || year.trim() ||
      yearFrom.trim() || yearTo.trim() || comment.trim();
    if (!hasAny) {
      toast.error("Fyll inn minst ett felt");
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
      <div className="space-y-1.5">
        <Label htmlFor="ik-brand">Merke <span className="text-destructive">*</span></Label>
        {brandMode === "select" ? (
          <select
            id="ik-brand"
            value={brands.find(b => b.name === brand)?.name ?? ""}
            onChange={(e) => handleBrandSelect(e.target.value)}
            disabled={brandsLoading}
            className={selectClass}
          >
            <option value="">{brandsLoading ? "Laster…" : "Velg merke…"}</option>
            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            <option value={OTHER}>Annet (skriv inn)</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <Input id="ik-brand" value={brand} onChange={(e) => { setBrand(e.target.value); setBrandId(null); }} placeholder="Skriv inn merke…" />
            <button type="button" onClick={() => { setBrandMode("select"); setBrand(""); setBrandId(null); }} className="px-3 text-sm text-muted-foreground hover:text-foreground underline whitespace-nowrap">
              Velg fra liste
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ik-model">Modell <span className="text-destructive">*</span></Label>
        {modelMode === "select" && brandId ? (
          <select
            id="ik-model"
            value={models.find(m => m.name === model)?.name ?? ""}
            onChange={(e) => handleModelSelect(e.target.value)}
            disabled={!brandId || modelsLoading}
            className={selectClass}
          >
            <option value="">
              {!brandId ? "Velg merke først…" : modelsLoading ? "Laster…" : models.length === 0 ? "Ingen modeller – skriv inn" : "Velg modell…"}
            </option>
            {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            <option value={OTHER}>Annet (skriv inn)</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <Input id="ik-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Skriv inn modell…" disabled={!brand} />
            {brandId && (
              <button type="button" onClick={() => { setModelMode("select"); setModel(""); }} className="px-3 text-sm text-muted-foreground hover:text-foreground underline whitespace-nowrap">
                Velg fra liste
              </button>
            )}
          </div>
        )}
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
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send inn"}
      </Button>
    </form>
  );
}
