import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useEventByIdForDashboard } from "@/hooks/useEventBySlug";
import { useUpdateEvent } from "@/hooks/useCreateEvent";
import { EventForm, type EventFormValues } from "@/components/events/EventForm";
import { EventImageUpload } from "@/components/events/EventImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        owner_page_id: values.owner_page_id ?? null,
      });
      toast.success("Arrangement oppdatert");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Noe gikk galt";
      toast.error(message);
    }
  }

  const toLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  return (
    <Layout>
      <Helmet>
        <title>{event.title} – Rediger | Bilgarasje</title>
      </Helmet>

      <div className="container max-w-2xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider">
              {event.title}
            </h1>
            <p className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded w-fit mt-1">
              bilgarasje.no/e/{event.slug}
            </p>
          </div>
          {event.status === "published" && (
            <Link
              to={`/e/${event.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Se siden <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <EventForm
              defaultValues={{
                event_type: event.event_type as any,
                title: event.title,
                slug: event.slug,
                location: event.location,
                starts_at: toLocal(event.starts_at),
                ends_at: event.ends_at ? toLocal(event.ends_at) : "",
                short_description: event.short_description ?? "",
                description: event.description ?? "",
                program: event.program ?? "",
                practical_info: event.practical_info ?? "",
                registration_url: event.registration_url ?? "",
                max_attendees: event.max_attendees ?? undefined,
                status: event.status as any,
                owner_page_id: event.owner_page_id ?? null,
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
