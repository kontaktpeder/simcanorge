import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCarEvents, useDeleteCarEvent, type CarEvent } from "@/hooks/useCarEvents";
import { CarEventForm } from "./CarEventForm";
import { getCategoryLabel, getEventLabel, type EventCategory, type EventType } from "@/data/carEventCategories";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface CarEventsListProps {
  carId: string;
}

export function CarEventsList({ carId }: CarEventsListProps) {
  // Owner/editor view — include private events (drives, etc.)
  const { data: events, isLoading } = useCarEvents(carId, { includePrivate: true });
  const deleteMutation = useDeleteCarEvent();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CarEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const handleEdit = (event: CarEvent) => { setEditingEvent(event); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingEvent(null); };
  const handleDelete = async () => {
    if (deleteEventId) { await deleteMutation.mutateAsync({ eventId: deleteEventId, carId }); setDeleteEventId(null); }
  };

  const formatTimeDisplay = (event: CarEvent) => {
    if (event.year) return event.year.toString();
    if (event.year_from) return event.year_to ? `${event.year_from}–${event.year_to}` : `${event.year_from}–nå`;
    return "Ukjent";
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" /></div>;
  }

  return (
    <div>
      {/* Section label + CTA */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[14px] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 flex items-center gap-2" style={oswald}>
          Bilens reise
        </h2>
        <button
          data-guide="add-timeline-event"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] font-bold text-primary/60 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/[0.06]"
          style={oswald}
        >
          <Plus className="w-4 h-4" /> Legg til hendelse
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border border-primary/15 rounded-xl p-5 sm:p-6 bg-primary/[0.03]"
        >
          <CarEventForm carId={carId} event={editingEvent || undefined} onClose={handleCloseForm} />
        </motion.div>
      )}

      {/* Timeline */}
      {!events || events.length === 0 ? (
        <div className="flex flex-col items-center py-16 sm:py-24">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent to-border/40" />
          <div className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center my-4">
            <Plus className="w-4 h-4 text-muted-foreground/30" />
          </div>
          <div className="w-[1px] h-8 bg-gradient-to-b from-border/40 to-transparent mb-6" />

          <p className="text-[1rem] uppercase tracking-[0.06em] font-bold text-muted-foreground/25 mb-2" style={chakra}>
            Start historien
          </p>
          <p className="text-[13px] text-muted-foreground/20 max-w-xs text-center mb-5" style={oswald}>
            Legg til hendelser for å dokumentere bilens reise gjennom tid.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-[12px] uppercase tracking-[0.12em] font-bold text-primary/60 hover:text-primary border-b border-primary/20 pb-0.5 transition-colors"
            style={oswald}
          >
            Legg til første hendelse →
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Glowing vertical line */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-[1px]"
            style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(168 50% 40% / 0.2) 10%, hsl(168 50% 40% / 0.15) 90%, transparent 100%)' }} />

          <div className="space-y-10 sm:space-y-14">
            {events.map((event, index) => {
              const category = event.category as EventCategory;
              const eventType = event.event_type as EventType;
              const displayTitle = event.title || getEventLabel(category, eventType);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="relative pl-12 sm:pl-16 group"
                >
                  {/* Dot on the line */}
                  <div className="absolute left-2.5 sm:left-4.5 top-1 w-3 h-3 rounded-full border-2 border-primary/30 bg-background z-10">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ animationDuration: '3s' }} />
                  </div>

                  {/* Year */}
                  <div className="mb-1.5">
                    <span className="text-[1.5rem] sm:text-[1.8rem] font-bold text-primary/35 leading-none" style={chakra}>
                      {formatTimeDisplay(event)}
                    </span>
                  </div>

                  {/* Category + visibility */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground/30" style={oswald}>
                      {getCategoryLabel(category)}
                    </span>
                    <VisibilityBadge visibility={event.visibility} />
                  </div>

                  {/* Title */}
                  <h4 className="text-[1rem] sm:text-[1.1rem] font-semibold text-foreground/80 mb-1">
                    {displayTitle}
                  </h4>

                  {/* Description */}
                  {event.description && (
                    <p className="text-[0.9rem] text-muted-foreground/45 leading-[1.7] max-w-lg">
                      {event.description}
                    </p>
                  )}

                  {/* Images */}
                  {event.car_event_images && event.car_event_images.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {event.car_event_images
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((img) => (
                          <img key={img.id} src={img.image_url} alt={img.alt_text || ""}
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border border-border/20 flex-shrink-0" />
                        ))}
                    </div>
                  )}

                  {/* Edit / delete */}
                  <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(event)}
                      className="text-muted-foreground/30 hover:text-foreground/60 p-1.5 rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteEventId(event.id)}
                      className="text-muted-foreground/30 hover:text-destructive/60 p-1.5 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett hendelse?</AlertDialogTitle>
            <AlertDialogDescription>Er du sikker? Dette kan ikke angres.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility?: string }) {
  if (!visibility || visibility === "public") {
    return (
      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-bold" style={oswald}>
        Offentlig
      </span>
    );
  }
  if (visibility === "private") {
    return (
      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-bold" style={oswald}>
        Privat
      </span>
    );
  }
  if (visibility === "link_only") {
    return (
      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold" style={oswald}>
        Kun lenke
      </span>
    );
  }
  return null;
}
