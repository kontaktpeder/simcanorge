import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const PAGE_TYPE_OPTIONS = [
  { value: "club", label: "Bilklubb / org." },
  { value: "workshop", label: "Verksted / garage" },
  { value: "garage", label: "Personlig garasje" },
  { value: "dealer", label: "Forhandler" },
  { value: "collection", label: "Samling" },
  { value: "other", label: "Annet" },
];

const MIN_BIO_LENGTH = 30;

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
  const [pageType, setPageType] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { mutate: sendRequest, isPending } = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Ingen profil");
      const { error } = await supabase
        .from("page_access_requests")
        .insert({
          profile_id: profile.id,
          message: message || null,
          page_type: pageType || null,
        } as any);
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

  // Requirements check
  const missingRequirements: string[] = [];
  if (!profile?.bio || profile.bio.trim().length < MIN_BIO_LENGTH) {
    missingRequirements.push("Bio på minst 30 tegn");
  }
  if (!profile?.is_public) {
    missingRequirements.push("Offentlig profil (slå på i Rediger profil)");
  }

  if (missingRequirements.length > 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Krav for å søke om sidetilgang</p>
              <p className="text-xs text-muted-foreground mt-1">Du må fullføre profilen din først:</p>
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside space-y-0.5">
                {missingRequirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/min-profil">Fullfør profil</Link>
          </Button>
        </CardContent>
      </Card>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Hva vil du opprette? *</p>
              <div className="grid grid-cols-2 gap-2">
                {PAGE_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setPageType(o.value)}
                    className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                      pageType === o.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Fortell kort hva du ønsker å opprette (valgfritt)…"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={isPending || !pageType} onClick={() => sendRequest()}>
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
