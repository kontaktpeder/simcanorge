import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState } from "react";

interface ProfileRow {
  id: string;
  display_name: string;
  slug: string;
  is_public: boolean;
  can_create_pages: boolean;
  created_at: string;
  email: string;
}

function useAllPersonProfiles(search: string) {
  return useQuery({
    queryKey: ["admin", "person_profiles", search],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("admin_search_profiles", { search_term: search.trim() });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });
}

function useToggleCanCreatePages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("person_profiles")
        .update({ can_create_pages: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "person_profiles"] });
    },
    onError: () => toast.error("Kunne ikke oppdatere tilgang"),
  });
}

function usePendingRequests() {
  return useQuery({
    queryKey: ["admin", "access_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_access_requests")
        .select(`id, message, created_at, profile_id, status, page_type`)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profile names for each request
      if (!data || data.length === 0) return [];
      const profileIds = data.map((r) => r.profile_id);
      const { data: profiles } = await supabase
        .from("person_profiles")
        .select("id, display_name, slug, bio, is_public")
        .in("id", profileIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return data.map((r) => ({
        ...r,
        profile: profileMap.get(r.profile_id) ?? null,
      }));
    },
  });
}

function useReviewRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, profileId, approve }: {
      requestId: string; profileId: string; approve: boolean;
    }) => {
      const { error: reqError } = await supabase
        .from("page_access_requests")
        .update({
          status: approve ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (reqError) throw reqError;

      if (approve) {
        const { error: profileError } = await supabase
          .from("person_profiles")
          .update({ can_create_pages: true })
          .eq("id", profileId);
        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Tilgang gitt" : "Forespørsel avslått");
      queryClient.invalidateQueries({ queryKey: ["admin", "access_requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "person_profiles"] });
    },
    onError: () => toast.error("Noe gikk galt"),
  });
}

export default function AdminPersonProfiles() {
  const [search, setSearch] = useState("");
  const { data: profiles, isLoading } = useAllPersonProfiles(search);
  const { mutate: toggle } = useToggleCanCreatePages();
  const { data: pendingRequests } = usePendingRequests();
  const { mutate: reviewRequest, isPending: reviewing } = useReviewRequest();

  return (
    <AdminLayout title="Brukerprofiler">
      <Helmet>
        <title>Brukerprofiler | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">Gi brukere tilgang til å opprette offentlige sider</p>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">
              Ventende forespørsler ({pendingRequests.length})
            </h2>
            <div className="rounded-lg border divide-y">
              {pendingRequests.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.profile?.display_name ?? "Ukjent"}</p>
                    <p className="text-xs text-muted-foreground">
                      bilgarasje.no/p/{r.profile?.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${r.profile?.is_public ? "text-green-600" : "text-amber-600"}`}>
                        {r.profile?.is_public ? "✓ Offentlig profil" : "⚠ Privat profil"}
                      </span>
                      {(r as any).page_type && (
                        <Badge variant="secondary" className="text-[10px]">
                          {(r as any).page_type}
                        </Badge>
                      )}
                    </div>
                    {r.profile?.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {r.profile.bio.slice(0, 100)}
                      </p>
                    )}
                    {r.message && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{r.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" disabled={reviewing}
                      onClick={() => reviewRequest({ requestId: r.id, profileId: r.profile_id, approve: true })}>
                      Godkjenn
                    </Button>
                    <Button size="sm" variant="outline" disabled={reviewing}
                      onClick={() => reviewRequest({ requestId: r.id, profileId: r.profile_id, approve: false })}>
                      Avslå
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Input
          placeholder="Søk etter navn, slug eller e-post…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {isLoading && <p className="text-muted-foreground">Laster…</p>}

        <div className="space-y-3">
          {profiles?.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{p.display_name}</p>
                  <p className="text-sm text-muted-foreground">bilgarasje.no/p/{p.slug}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={p.is_public ? "default" : "secondary"}>
                    {p.is_public ? "Offentlig" : "Privat"}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Kan opprette sider</span>
                    <Switch
                      checked={p.can_create_pages}
                      onCheckedChange={(value) => {
                        toggle(
                          { id: p.id, value },
                          { onSuccess: () => toast.success(value ? "Tilgang gitt" : "Tilgang fjernet") }
                        );
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!isLoading && profiles?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Ingen profiler funnet.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
