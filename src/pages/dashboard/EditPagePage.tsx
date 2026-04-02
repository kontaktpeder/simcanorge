import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageById, useUpdatePage, useDeletePage } from "@/hooks/usePageById";
import { PageForm, type PageFormValues } from "@/components/pages/PageForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle } from "lucide-react";

const roleLabels: Record<string, string> = {
  owner: "Eier",
  admin: "Admin",
  editor: "Redaktør",
  moderator: "Moderator",
  member: "Medlem",
};

function usePageMemberships(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page_memberships", pageId],
    queryFn: async () => {
      if (!pageId) return [];
      const { data, error } = await supabase
        .from("page_memberships")
        .select(`
          id,
          role,
          joined_at,
          person_profiles (
            id,
            display_name,
            slug,
            avatar_url
          )
        `)
        .eq("page_id", pageId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!pageId,
  });
}

export default function EditPagePage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePageById(pageId);
  const { mutateAsync, isPending } = useUpdatePage(pageId!);
  const { mutateAsync: deletePage, isPending: isDeleting } = useDeletePage();
  const { data: members } = usePageMemberships(pageId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) return <p className="p-8 text-muted-foreground">Laster…</p>;
  if (!page) return <p className="p-8 text-muted-foreground">Siden ble ikke funnet.</p>;

  async function handleSubmit(values: PageFormValues) {
    try {
      await mutateAsync({
        ...values,
        founded_year: values.founded_year !== "" && values.founded_year !== undefined
          ? Number(values.founded_year)
          : null,
        logo_url: values.logo_url || null,
        cover_url: values.cover_url || null,
        contact_email: values.contact_email || null,
        website: values.website || null,
        theme_color: values.theme_color || null,
        tagline: values.tagline || null,
        about: values.about || null,
        contact_phone: values.contact_phone || null,
        location: values.location || null,
      });
      toast.success("Siden er oppdatert");
    } catch (err: any) {
      toast.error(err.message ?? "Noe gikk galt");
    }
  }

  async function handleDelete() {
    try {
      await deletePage(pageId!);
      toast.success("Siden er slettet");
      navigate("/dashboard/sider");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Kunne ikke slette siden");
    }
  }

  const memberCount = members?.length ?? 0;

  return (
    <>
      <Helmet>
        <title>Rediger: {page.title} | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rediger: {page.title}</h1>
          <p className="text-sm text-muted-foreground">
            Adresse:{" "}
            <span className="font-mono text-foreground">bilgarasje.no/s/{page.slug}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <PageForm
              defaultValues={page as any}
              onSubmit={handleSubmit}
              isPending={isPending}
              showSlug={false}
            />
          </CardContent>
        </Card>

        {/* Members list */}
        {members && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medlemmer ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3">
                  {m.person_profiles?.avatar_url ? (
                    <img
                      src={m.person_profiles.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {m.person_profiles?.display_name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.person_profiles?.display_name ?? "Ukjent"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      bilgarasje.no/p/{m.person_profiles?.slug}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[m.role] ?? m.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Faresone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sletting er permanent og kan ikke angres. Siden, alle arrangement knyttet til
              siden{memberCount > 0 ? `, og ${memberCount} medlemskap` : ""} slettes også.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                Slett siden
              </button>
            ) : (
              <div className="space-y-3 p-4 border border-destructive/30 rounded-md bg-destructive/5">
                <p className="text-sm font-medium text-destructive">
                  Er du sikker?{memberCount > 1 ? ` ${memberCount} medlemmer mister tilgang.` : ""} Dette kan ikke angres.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors rounded-md disabled:opacity-50"
                  >
                    {isDeleting ? "Sletter…" : "Ja, slett permanent"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}