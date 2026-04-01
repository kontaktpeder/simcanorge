import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { usePageById, useUpdatePage } from "@/hooks/usePageById";
import { PageForm, type PageFormValues } from "@/components/pages/PageForm";
import { Card, CardContent } from "@/components/ui/card";

export default function EditPagePage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { data: page, isLoading } = usePageById(pageId);
  const { mutateAsync, isPending } = useUpdatePage(pageId!);

  if (isLoading) return <p className="p-8 text-muted-foreground">Laster…</p>;
  if (!page) return <p className="p-8 text-muted-foreground">Siden ble ikke funnet.</p>;

  async function handleSubmit(values: PageFormValues) {
    await mutateAsync({
      ...values,
      founded_year: values.founded_year ? Number(values.founded_year) : null,
      logo_url: values.logo_url || null,
      cover_url: values.cover_url || null,
      contact_email: values.contact_email || null,
      website: values.website || null,
    });
    toast.success("Siden er oppdatert");
  }

  return (
    <>
      <Helmet>
        <title>Rediger: {page.title} | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rediger: {page.title}</h1>
          <p className="text-sm text-muted-foreground">bilgarasje.no/s/{page.slug}</p>
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
      </div>
    </>
  );
}
