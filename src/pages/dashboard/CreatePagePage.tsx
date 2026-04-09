import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageForm, type PageFormValues } from "@/components/pages/PageForm";
import { Card, CardContent } from "@/components/ui/card";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { useAuth } from "@/hooks/useAuth";

export default function CreatePagePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useMyPersonProfile();
  const { user } = useAuth();
  const { data: ownerProfile } = useOwnerProfile(user?.id);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const { data, error } = await supabase.rpc("create_page_with_owner", {
        p_page_type: values.page_type,
        p_title: values.title,
        p_slug: values.slug,
        p_tagline: values.tagline || null,
        p_about: values.about || null,
        p_logo_url: values.logo_url || null,
        p_cover_url: values.cover_url || null,
        p_theme_color: values.theme_color || null,
        p_contact_email: values.contact_email || null,
        p_contact_phone: values.contact_phone || null,
        p_website: values.website || null,
        p_location: values.location || null,
        p_founded_year: values.founded_year !== "" && values.founded_year !== undefined
          ? Number(values.founded_year)
          : null,
        p_is_public: values.is_public,
      } as any);
      if (error) throw error;

      // Write contact_email back to owners if not already set
      if (!ownerProfile?.contact_email && values.contact_email && ownerProfile?.id) {
        await supabase
          .from("owners")
          .update({ contact_email: values.contact_email } as any)
          .eq("id", ownerProfile.id);
      }

      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["my_pages"] });
      queryClient.invalidateQueries({ queryKey: ["owner-profile", user?.id] });
      toast.success("Siden er opprettet!");
      navigate(`/dashboard/sider/${data.id}`);
    },
    onError: (err: any) => {
      if (err?.code === "23505" || err?.message?.includes("unique")) {
        toast.error("Denne adressen er allerede i bruk. Velg en annen.");
      } else {
        toast.error(err.message ?? "Noe gikk galt");
      }
    },
  });

  if (!profile?.can_create_pages) {
    return <Navigate to="/dashboard/sider" replace />;
  }

  return (
    <Layout>
      <Helmet>
        <title>Opprett ny side | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Opprett ny side</h1>
          <p className="text-muted-foreground">Du blir automatisk satt som eier</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <PageForm
              onSubmit={mutateAsync}
              isPending={isPending}
              submitLabel="Opprett side"
              defaultValues={{
                contact_email: ownerProfile?.contact_email || "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
