import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCarEvents, useDeleteCarEvent, type CarEvent } from "@/hooks/useCarEvents";
import { CarEventForm } from "./CarEventForm";
import { getCategoryIcon, getCategoryLabel, getEventLabel, type EventCategory, type EventType } from "@/data/carEventCategories";
import { CategoryIcon } from "./CategoryIcon";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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

  /* ─── Color helpers ─── */
  const sectionTitleCls = isLight ? 'text-stone-400' : 'text-muted-foreground/40';
  const ctaBtnCls = isLight
    ? 'text-teal-600/80 hover:text-teal-700 hover:bg-teal-50'
    : 'text-primary/70 hover:text-primary hover:bg-primary/[0.06]';
  const spineCss = isLight
    ? 'linear-gradient(180deg, transparent 0%, rgba(168,162,158,0.25) 10%, rgba(168,162,158,0.18) 90%, transparent 100%)'
    : 'linear-gradient(180deg, transparent 0%, hsl(168 50% 40% / 0.2) 10%, hsl(168 50% 40% / 0.15) 90%, transparent 100%)';
  const dotBorder = isLight ? 'border-stone-300' : 'border-primary/30';
  const dotPulse = isLight ? 'bg-stone-300/40' : 'bg-primary/20';
  const yearCls = isLight ? 'text-stone-800/30' : 'text-primary/35';
  const catCls = isLight ? 'text-stone-400' : 'text-muted-foreground/30';
  const titleCls = isLight ? 'text-stone-700' : 'text-foreground/80';
  const descCls = isLight ? 'text-stone-500' : 'text-muted-foreground/45';
  const editBtnCls = isLight ? 'text-stone-300 hover:text-stone-600' : 'text-muted-foreground/30 hover:text-foreground/60';
  const deleteBtnCls = isLight ? 'text-stone-300 hover:text-red-500' : 'text-muted-foreground/30 hover:text-destructive/60';
  const formBg = isLight ? 'border-teal-200 bg-teal-50/40' : 'border-primary/15 bg-primary/[0.03]';

  return (
    <div>
      {/* Section label + CTA */}
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-[0.85rem] uppercase tracking-[0.12em] font-bold ${sectionTitleCls} flex items-center gap-2`} style={oswald}>
          Bilens reise
        </h2>
        <button
          data-guide="add-timeline-event"
          onClick={() => setShowForm(true)}
          className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] font-bold transition-colors px-3 py-2 rounded-lg ${ctaBtnCls}`}
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
          className={`mb-10 border rounded-xl p-5 sm:p-6 ${formBg}`}
        >
          <CarEventForm carId={carId} event={editingEvent || undefined} onClose={handleCloseForm} />
        </motion.div>
      )}

      {/* Timeline */}
      {!events || events.length === 0 ? (
        /* ─── EMPTY STATE ─── */
        <div className="flex flex-col items-center py-16 sm:py-24">
          <div className={`w-[1px] h-16 ${isLight ? 'bg-gradient-to-b from-transparent to-stone-200' : 'bg-gradient-to-b from-transparent to-border/40'}`} />
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center my-4 ${isLight ? 'border-stone-200' : 'border-border/30'}`}>
            <Plus className={`w-4 h-4 ${isLight ? 'text-stone-300' : 'text-muted-foreground/30'}`} />
          </div>
          <div className={`w-[1px] h-8 ${isLight ? 'bg-gradient-to-b from-stone-200 to-transparent' : 'bg-gradient-to-b from-border/40 to-transparent'} mb-6`} />

          <p className={`text-[1rem] uppercase tracking-[0.06em] font-bold mb-2 ${isLight ? 'text-stone-300' : 'text-muted-foreground/25'}`} style={chakra}>
            Start historien
          </p>
          <p className={`text-[13px] max-w-xs text-center mb-5 ${isLight ? 'text-stone-300' : 'text-muted-foreground/20'}`}>
            Legg til hendelser for å dokumentere bilens reise gjennom tid.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className={`text-[11px] uppercase tracking-[0.12em] font-bold border-b pb-0.5 transition-colors ${isLight ? 'text-teal-600/60 hover:text-teal-700 border-teal-600/20' : 'text-primary/60 hover:text-primary border-primary/20'}`}
            style={oswald}
          >
            Legg til første hendelse →
          </button>
        </div>
      ) : (
        /* ─── TIMELINE ─── */
        <div className="relative">
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-[1px]"
            style={{ background: spineCss }} />

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
                  <div className={`absolute left-2.5 sm:left-4.5 top-1 w-3 h-3 rounded-full border-2 ${dotBorder} bg-white z-10`}>
                    <div className={`absolute inset-0 rounded-full ${dotPulse} animate-pulse`} style={{ animationDuration: '3s' }} />
                  </div>

                  <div className="mb-1.5">
                    <span className={`text-[1.5rem] sm:text-[1.8rem] font-bold ${yearCls} leading-none`} style={chakra}>
                      {formatTimeDisplay(event)}
                    </span>
                  </div>

                  <span className={`text-[10px] uppercase tracking-[0.1em] font-bold ${catCls} mb-1.5 block`} style={oswald}>
                    {getCategoryLabel(category)}
                  </span>

                  <h4 className={`text-[1rem] sm:text-[1.1rem] font-semibold ${titleCls} mb-1`}>
                    {displayTitle}
                  </h4>

                  {event.description && (
                    <p className={`text-[0.9rem] ${descCls} leading-[1.7] max-w-lg`}>
                      {event.description}
                    </p>
                  )}

                  {event.car_event_images && event.car_event_images.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {event.car_event_images
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((img) => (
                          <img key={img.id} src={img.image_url} alt={img.alt_text || ""}
                            className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0 ${isLight ? 'border border-stone-200 shadow-sm' : 'border border-border/20'}`} />
                        ))}
                    </div>
                  )}

                  <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(event)}
                      className={`${editBtnCls} p-1.5 rounded transition-colors`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteEventId(event.id)}
                      className={`${deleteBtnCls} p-1.5 rounded transition-colors`}>
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
