import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { RELATIONSHIP_LABELS, type RelationshipType } from "@/lib/relationshipTypes";

type Row = {
  id: string;
  car_id: string;
  requester_id: string;
  relationship_type: RelationshipType;
  note: string | null;
  relationship_start_year: number | null;
  relationship_end_year: number | null;
  wants_stewardship: boolean;
  status: string;
  created_at: string;
  reviewer_note: string | null;
};

type CarMeta = { id: string; title: string; slug: string };

export default function AdminCarRelationshipRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [cars, setCars] = useState<Record<string, CarMeta>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("car_relationship_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("status", "pending");
    const { data, error } = await query;
    if (error) {
      toast({ title: "Kunne ikke laste forespørsler", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = (data as any as Row[]) || [];
    setRows(list);

    const carIds = Array.from(new Set(list.map((r) => r.car_id)));
    if (carIds.length) {
      const { data: cs } = await supabase.from("cars").select("id, title, slug").in("id", carIds);
      const map: Record<string, CarMeta> = {};
      (cs || []).forEach((c: any) => { map[c.id] = c; });
      setCars(map);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [filter]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    const { data, error } = await supabase.rpc("approve_car_relationship_request" as any, { p_request_id: id });
    setBusyId(null);
    const res = data as any;
    if (error || !res?.success) {
      toast({ title: "Kunne ikke godkjenne", description: error?.message || res?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Godkjent" });
    void load();
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Eventuell begrunnelse til avsender (valgfritt):") ?? "";
    setBusyId(id);
    const { data, error } = await supabase.rpc("reject_car_relationship_request" as any, {
      p_request_id: id,
      p_note: note || null,
    });
    setBusyId(null);
    const res = data as any;
    if (error || !res?.success) {
      toast({ title: "Kunne ikke avvise", description: error?.message || res?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Avvist" });
    void load();
  };

  const sorted = useMemo(() => rows, [rows]);

  return (
    <AdminLayout title="Relasjonsforespørsler">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-foreground">Relasjonsforespørsler</h1>
            <p className="text-sm text-muted-foreground">Brukere som ønsker å knyttes til eksisterende biler.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
              Venter
            </Button>
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              Alle
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : sorted.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Ingen forespørsler {filter === "pending" ? "venter på behandling" : "registrert"}.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((r) => {
              const car = cars[r.car_id];
              return (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-base text-foreground truncate">
                          {car?.title || "Ukjent bil"}
                        </span>
                        {car?.slug && (
                          <Link to={`/biler/${car.slug}`} target="_blank" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                            Se profil <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="secondary">{RELATIONSHIP_LABELS[r.relationship_type]}</Badge>
                        {r.wants_stewardship && <Badge variant="outline">Ønsker forvaltning</Badge>}
                        <Badge variant={r.status === "pending" ? "default" : r.status === "approved" ? "secondary" : "outline"}>
                          {r.status}
                        </Badge>
                        {(r.relationship_start_year || r.relationship_end_year) && (
                          <span className="text-muted-foreground">
                            {r.relationship_start_year ?? "?"}–{r.relationship_end_year ?? "nå"}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("no-NO")}
                        </span>
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleApprove(r.id)} disabled={busyId === r.id}>
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Godkjenn</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} disabled={busyId === r.id}>
                          <XCircle className="h-4 w-4 mr-1" /> Avvis
                        </Button>
                      </div>
                    )}
                  </div>

                  {r.note && (
                    <div className="rounded-md bg-muted/40 border border-border p-3 text-sm text-foreground/90 whitespace-pre-wrap">
                      {r.note}
                    </div>
                  )}

                  <div className="text-[11px] text-muted-foreground">
                    Avsender: <span className="font-mono">{r.requester_id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
