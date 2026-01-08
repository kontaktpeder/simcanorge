import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Calendar, Clock, Loader2 } from "lucide-react";

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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Bilens reise
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Legg til hendelse
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <CarEventForm
              carId={carId}
              event={editingEvent || undefined}
              onClose={handleCloseForm}
            />
          </div>
        )}
        
        {!events || events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ingen hendelser lagt til ennå.</p>
            <p className="text-sm mt-1">
              Klikk "Legg til hendelse" for å starte bilens historie.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const category = event.category as EventCategory;
              const eventType = event.event_type as EventType;
              const displayTitle = event.title || getEventLabel(category, eventType);
              
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl">{getCategoryIcon(category)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-primary">
                        {formatTimeDisplay(event)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getCategoryLabel(category)}
                      </span>
                    </div>
                    <h4 className="font-semibold">{displayTitle}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.car_event_images && event.car_event_images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {event.car_event_images.slice(0, 4).map((img) => (
                          <img
                            key={img.id}
                            src={img.image_url}
                            alt={img.alt_text || ""}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ))}
                        {event.car_event_images.length > 4 && (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            +{event.car_event_images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteEventId(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett hendelse?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne hendelsen? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
