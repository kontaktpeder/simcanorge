import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState } from "react";
import { Users } from "lucide-react";

function useAllPersonProfiles(search: string) {
  return useQuery({
    queryKey: ["admin", "person_profiles", search],
    queryFn: async () => {
      let query = supabase
        .from("person_profiles")
        .select("id, display_name, slug, is_public, can_create_pages, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (search.trim()) {
        query = query.ilike("display_name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
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

export default function AdminPersonProfiles() {
  const [search, setSearch] = useState("");
  const { data: profiles, isLoading } = useAllPersonProfiles(search);
  const { mutate: toggle } = useToggleCanCreatePages();

  return (
    <AdminLayout title="Brukerprofiler">
      <Helmet>
        <title>Brukerprofiler | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">Gi brukere tilgang til å opprette offentlige sider</p>
        </div>

        <Input
          placeholder="Søk etter navn…"
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
