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

interface CarEventsListProps {
  carId: string;
  variant?: 'dark' | 'light';
}

export function CarEventsList({ carId, variant = 'dark' }: CarEventsListProps) {
  const isLight = variant === 'light';
  const { data: events, isLoading } = useCarEvents(carId);
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
    return <div className="flex justify-center py-16"><Loader2 className={`h-6 w-6 animate-spin ${isLight ? 'text-stone-300' : 'text-muted-foreground/30'}`} /></div>;
  }

  return (
    <div>
      {/* Section label + CTA */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`flex items-center gap-2 text-base font-semibold ${isLight ? 'text-stone-500' : 'text-muted-foreground/60'}`}>
          Bilens reise
        </h2>
        <button
          data-guide="add-timeline-event"
          onClick={() => setShowForm(true)}
          className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
            isLight ? 'text-teal-600 hover:text-teal-700 hover:bg-teal-50' : 'text-primary hover:bg-primary/10'
          }`}
        >
          <Plus className="w-4 h-4" /> Legg til hendelse
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 border rounded-xl p-5 sm:p-6 ${
            isLight ? 'border-stone-200 bg-white' : 'border-primary/15 bg-primary/[0.03]'
          }`}
        >
          <CarEventForm carId={carId} event={editingEvent || undefined} onClose={handleCloseForm} />
        </motion.div>
      )}

      {/* Timeline */}
      {!events || events.length === 0 ? (
        <div className="flex flex-col items-center py-14 sm:py-20">
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-4 ${
            isLight ? 'border-stone-200' : 'border-border/30'
          }`}>
            <Plus className={`w-4 h-4 ${isLight ? 'text-stone-300' : 'text-muted-foreground/30'}`} />
          </div>
          <p className={`text-lg font-semibold mb-1 ${isLight ? 'text-stone-400' : 'text-muted-foreground/40'}`}>
            Start historien
          </p>
          <p className={`text-sm max-w-xs text-center mb-5 ${isLight ? 'text-stone-400' : 'text-muted-foreground/30'}`}>
            Legg til hendelser for å dokumentere bilens reise gjennom tid.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className={`text-sm font-medium transition-colors ${
              isLight ? 'text-teal-600 hover:text-teal-700 underline underline-offset-4' : 'text-primary hover:text-primary/80 underline underline-offset-4'
            }`}
          >
            Legg til første hendelse →
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Spine */}
          <div className={`absolute left-4 sm:left-5 top-0 bottom-0 w-[2px] rounded-full ${
            isLight ? 'bg-stone-200' : 'bg-border/30'
          }`} />

          <div className="space-y-8 sm:space-y-10">
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
                  className="relative pl-12 sm:pl-14 group"
                >
                  {/* Dot */}
                  <div className={`absolute left-2.5 sm:left-3.5 top-2 w-3.5 h-3.5 rounded-full border-2 z-10 ${
                    isLight ? 'border-teal-400 bg-white' : 'border-primary bg-background'
                  }`} />

                  {/* Year */}
                  <span className={`text-2xl sm:text-3xl font-bold leading-none block mb-1 ${
                    isLight ? 'text-stone-300' : 'text-primary/30'
                  }`}>
                    {formatTimeDisplay(event)}
                  </span>

                  {/* Category */}
                  <span className={`text-xs font-semibold block mb-1 ${
                    isLight ? 'text-stone-400' : 'text-muted-foreground/40'
                  }`}>
                    {getCategoryLabel(category)}
                  </span>

                  {/* Title */}
                  <h4 className={`text-base sm:text-lg font-semibold mb-1 ${
                    isLight ? 'text-stone-700' : 'text-foreground/80'
                  }`}>
                    {displayTitle}
                  </h4>

                  {/* Description */}
                  {event.description && (
                    <p className={`text-sm leading-relaxed max-w-lg ${
                      isLight ? 'text-stone-500' : 'text-muted-foreground/50'
                    }`}>
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
                            className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0 ${
                              isLight ? 'border border-stone-200' : 'border border-border/20'
                            }`} />
                        ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(event)}
                      className={`p-1.5 rounded transition-colors ${
                        isLight ? 'text-stone-300 hover:text-stone-600 hover:bg-stone-100' : 'text-muted-foreground/30 hover:text-foreground/60'
                      }`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteEventId(event.id)}
                      className={`p-1.5 rounded transition-colors ${
                        isLight ? 'text-stone-300 hover:text-red-500 hover:bg-red-50' : 'text-muted-foreground/30 hover:text-destructive/60'
                      }`}>
                      <Trash2 className="w-4 h-4" />
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
