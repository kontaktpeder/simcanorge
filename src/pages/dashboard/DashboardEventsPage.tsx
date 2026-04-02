import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { useMyEvents } from "@/hooks/useMyEvents";
import { Plus, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function DashboardEventsPage() {
  const { data: events, isLoading } = useMyEvents();
  return (
    <Layout>
      <Helmet>
        <title>Mine arrangementer | Bilgarasje</title>
      </Helmet>

      <div className="container max-w-3xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider">
              Mine arrangementer
            </h1>
            <p className="text-muted-foreground mt-1">
              Treff og events du har opprettet
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/events/ny">
              <Plus className="w-4 h-4 mr-2" />
              Nytt arrangement
            </Link>
          </Button>
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-center py-12">Laster…</p>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <div className="border-2 border-dashed border-foreground/15 p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">
              Du har ikke opprettet noen arrangementer ennå.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard/events/ny">
                Opprett ditt første arrangement
              </Link>
            </Button>
          </div>
        )}

        {(() => {
          const active = events?.filter((e: any) => e.status !== 'draft') ?? [];
          const drafts = events?.filter((e: any) => e.status === 'draft') ?? [];
          return (
            <>
              {active.length > 0 && (
                <div className="space-y-3">
                  {active.map((e: any) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              )}
              {drafts.length > 0 && (
                <div className="space-y-3 mt-8">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-display">
                    Utkast / avpubliserte
                  </h2>
                  {drafts.map((e: any) => (
                    <div key={e.id} className="opacity-50">
                      <EventCard event={e} />
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </Layout>
  );
}
