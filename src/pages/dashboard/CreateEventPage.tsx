import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import { EventForm, type EventFormValues } from "@/components/events/EventForm";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateEvent();

  async function onSubmit(values: EventFormValues) {
    try {
      const event = await mutateAsync({
        event_type: values.event_type,
        title: values.title,
        slug: values.slug,
        location: values.location,
        starts_at: values.starts_at,
        ends_at: values.ends_at || null,
        status: values.status,
      });
      toast.success("Arrangement opprettet!");
      navigate(`/dashboard/events/${(event as any).id}`);
    } catch (err: any) {
      if (err?.code === "23505")
        toast.error("En adresse med dette navnet finnes allerede.");
      else toast.error(err.message ?? "Noe gikk galt");
    }
  }

  return (
    <Layout>
      <Helmet>
        <title>Opprett arrangement | Bilgarasje</title>
      </Helmet>

      <div className="container max-w-2xl py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider">
            Opprett arrangement
          </h1>
          <p className="text-muted-foreground mt-1">
            Du kan legge til bilder og mer info etter opprettelse
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <EventForm onSubmit={onSubmit} isPending={isPending} mode="create" />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
