import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCarEvents, useDeleteCarEvent, type CarEvent } from "@/hooks/useCarEvents";
import { CarEventForm } from "./CarEventForm";
import { getCategoryIcon, getCategoryLabel, getEventLabel, type EventCategory, type EventType } from "@/data/carEventCategories";
import { CategoryIcon } from "./CategoryIcon";
import { Plus, Pencil, Trash2, Calendar, Clock, Loader2 } from "lucide-react";
import { EnamelCard, SectionHeader, EmptyState, BigActionButton } from "@/components/ui/garage";
import { motion } from "framer-motion";

interface CarEventsListProps {
  carId: string;
}

export function CarEventsList({ carId }: CarEventsListProps) {
  const { data: events, isLoading } = useCarEvents(carId);
  const deleteMutation = useDeleteCarEvent();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CarEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  
  const handleEdit = (event: CarEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };
  
  const handleDelete = async () => {
    if (deleteEventId) {
      await deleteMutation.mutateAsync({ eventId: deleteEventId, carId });
      setDeleteEventId(null);
    }
  };
  
  const formatTimeDisplay = (event: CarEvent) => {
    if (event.year) {
      return event.year.toString();
    }
    if (event.year_from) {
      if (event.year_to) {
        return `${event.year_from}–${event.year_to}`;
      }
      return `${event.year_from}–nå`;
    }
    return "Ukjent";
  };

  if (isLoading) {
    return (
      <EnamelCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </EnamelCard>
    );
  }

  return (
    <EnamelCard className="p-0 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Bilens reise"
            icon={<Clock className="w-6 h-6" />}
            description="Dokumenter viktige hendelser i bilens historie"
          />
          <BigActionButton
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowForm(true)}
          >
            Legg til hendelse
          </BigActionButton>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5"
          >
            <CarEventForm
              carId={carId}
              event={editingEvent || undefined}
              onClose={handleCloseForm}
            />
          </motion.div>
        )}
        
        {!events || events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title="Ingen hendelser ennå"
            description="Legg til hendelser for å dokumentere bilens historie. Når ble den produsert? Når skiftet den eier?"
            action={{
              label: "Legg til første hendelse",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const category = event.category as EventCategory;
              const eventType = event.event_type as EventType;
              const displayTitle = event.title || getEventLabel(category, eventType);
              const iconName = getCategoryIcon(category);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex items-start gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <CategoryIcon iconName={iconName} size="lg" className="text-primary" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-primary font-display">
                        {formatTimeDisplay(event)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-sm text-muted-foreground">
                        {getCategoryLabel(category)}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-foreground mb-1">{displayTitle}</h4>
                    {event.description && (
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.car_event_images && event.car_event_images.length > 0 && (
                      <div className="flex gap-3 mt-4">
                        {event.car_event_images
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((img) => (
                          <img
                            key={img.id}
                            src={img.image_url}
                            alt={img.alt_text || ""}
                            className="h-20 w-20 rounded-lg object-cover border-2 border-border hover:border-primary/50 transition-colors"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteEventId(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Slett hendelse?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Er du sikker på at du vil slette denne hendelsen? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px] text-base">Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[48px] text-base"
            >
              Slett hendelse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EnamelCard>
  );
}
