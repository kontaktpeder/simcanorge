import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useEventByIdForDashboard } from "@/hooks/useEventBySlug";
import { useUpdateEvent } from "@/hooks/useCreateEvent";
import { EventForm, type EventFormValues } from "@/components/events/EventForm";
import { EventImageUpload } from "@/components/events/EventImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEventByIdForDashboard(eventId);
  const { mutateAsync, isPending } = useUpdateEvent(eventId!);

  if (isLoading)
    return (
      <Layout>
        <div className="container py-12 text-center text-muted-foreground">
          Laster…
        </div>
      </Layout>
    );
  if (!event)
    return (
      <Layout>
        <div className="container py-12 text-center text-muted-foreground">
          Arrangement ikke funnet.
        </div>
      </Layout>
    );

  const ev = event as any;

  async function onSubmit(values: EventFormValues) {
    try {
      await mutateAsync({
        event_type: values.event_type,
        title: values.title,
        location: values.location,
        starts_at: values.starts_at,
        ends_at: values.ends_at || null,
        short_description: values.short_description || null,
        description: values.description || null,
        program: values.program || null,
        practical_info: values.practical_info || null,
        registration_url: values.registration_url || null,
        max_attendees: values.max_attendees
          ? Number(values.max_attendees)
          : null,
        status: values.status,
      });
      toast.success("Arrangement oppdatert");
    } catch (err: any) {
      toast.error(err.message ?? "Noe gikk galt");
    }
  }

  // Format datetime-local value
  const toLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  return (
    <Layout>
      <Helmet>
        <title>{ev.title} – Rediger | Bilgarasje</title>
      </Helmet>

      <div className="container max-w-2xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider">
              {ev.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">/e/{ev.slug}</p>
          </div>
          {ev.status === "published" && (
            <Link
              to={`/e/${ev.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Se side <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <EventForm
              defaultValues={{
                event_type: ev.event_type,
                title: ev.title,
                slug: ev.slug,
                location: ev.location,
                starts_at: toLocal(ev.starts_at),
                ends_at: ev.ends_at ? toLocal(ev.ends_at) : "",
                short_description: ev.short_description ?? "",
                description: ev.description ?? "",
                program: ev.program ?? "",
                practical_info: ev.practical_info ?? "",
                registration_url: ev.registration_url ?? "",
                max_attendees: ev.max_attendees ?? undefined,
                status: ev.status,
              }}
              onSubmit={onSubmit}
              isPending={isPending}
              mode="edit"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bilder</CardTitle>
          </CardHeader>
          <CardContent>
            <EventImageUpload eventId={eventId!} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
