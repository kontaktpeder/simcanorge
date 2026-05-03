import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCreateQuestion } from "@/hooks/useCreateQuestion";
import { toast } from "sonner";

export default function NyttSporsmal() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialCarId = params.get("car_id");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [carId, setCarId] = useState<string>(initialCarId ?? "");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login?returnUrl=/sporsmal/ny");
    }
  }, [user, isLoading, navigate]);

  const { data: myCars } = useQuery({
    queryKey: ["my-cars-min", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_owners")
        .select("car_id, cars:car_id ( id, title, slug )")
        .eq("user_id", user!.id)
        .eq("role", "owner");
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.cars)
        .filter(Boolean) as { id: string; title: string; slug: string }[];
    },
  });

  const create = useCreateQuestion();

  const canSubmit = useMemo(
    () => title.trim().length >= 5 && body.trim().length >= 10 && !create.isPending,
    [title, body, create.isPending]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const res = await create.mutateAsync({
        title,
        body,
        carId: carId || null,
      });
      toast.success("Spørsmål publisert");
      navigate(`/sporsmal/${res.slug}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Kunne ikke publisere");
    }
  }

  return (
    <Layout>
      <Helmet>
        <title>Still spørsmål — Bilgarasje.no</title>
      </Helmet>
      <PageHeader title="Still spørsmål" subtitle="Få svar fra fellesskapet" />
      <section className="bg-[#070b10] py-8">
        <form
          onSubmit={onSubmit}
          className="max-w-[720px] mx-auto px-5 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="q-title" className="text-white/80">Tittel</Label>
            <Input
              id="q-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hva lurer du på?"
              maxLength={300}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-body" className="text-white/80">Beskrivelse</Label>
            <Textarea
              id="q-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder="Gi nok kontekst til at noen kan svare godt."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {myCars && myCars.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="q-car" className="text-white/80">Knytt til en av dine biler (valgfritt)</Label>
              <select
                id="q-car"
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="">Ingen bil</option>
                {myCars.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!canSubmit}>
              {create.isPending ? "Publiserer..." : "Publiser spørsmål"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link to="/hjem">Avbryt</Link>
            </Button>
          </div>
        </form>
      </section>
    </Layout>
  );
}
