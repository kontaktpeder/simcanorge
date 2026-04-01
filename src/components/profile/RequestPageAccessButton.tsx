import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

function useMyAccessRequest(profileId: string | undefined) {
  return useQuery({
    queryKey: ["access_request", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await supabase
        .from("page_access_requests")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

export function RequestPageAccessButton() {
  const { data: profile } = useMyPersonProfile();
  const { data: request, isLoading } = useMyAccessRequest(profile?.id);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { mutate: sendRequest, isPending } = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Ingen profil");
      const { error } = await supabase
        .from("page_access_requests")
        .insert({ profile_id: profile.id, message: message || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Forespørsel sendt!");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["access_request", profile?.id] });
    },
    onError: () => toast.error("Noe gikk galt"),
  });

  if (profile?.can_create_pages) return null;
  if (isLoading) return null;

  if (request) {
    const statusLabel: Record<string, string> = {
      pending: "Venter på godkjenning",
      approved: "Godkjent",
      rejected: "Avslått",
    };
    const statusVariant: Record<string, "secondary" | "default" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Forespørsel om sidetilgang:</span>
        <Badge variant={statusVariant[request.status] ?? "secondary"}>
          {statusLabel[request.status] ?? request.status}
        </Badge>
      </div>
    );
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          Be om tilgang til å opprette sider
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Be om sidetilgang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Fortell kort hva du ønsker å opprette (valgfritt)…"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={isPending} onClick={() => sendRequest()}>
                {isPending ? "Sender…" : "Send forespørsel"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
