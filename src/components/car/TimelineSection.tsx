import { useCarEvents, type CarEvent } from "@/hooks/useCarEvents";
import { getCategoryIcon, getCategoryLabel, getEventLabel, type EventCategory, type EventType } from "@/data/carEventCategories";
import { Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineSectionProps {
  carId: string;
  createdAt?: string;
  publishedAt?: string | null;
}

export function TimelineSection({ carId, createdAt, publishedAt }: TimelineSectionProps) {
  const { data: events, isLoading } = useCarEvents(carId);
  
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
    return "";
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Fallback if no events
  if (!events || events.length === 0) {
    const fallbackDate = publishedAt || createdAt;
    const fallbackYear = fallbackDate ? new Date(fallbackDate).getFullYear() : null;
    
    return (
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative pl-12"
          >
            {/* Dot */}
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            
            <div className="text-sm text-primary font-medium">{fallbackYear}</div>
            <h4 className="font-semibold mt-1">Registrert på Simca Norge</h4>
            <p className="text-muted-foreground text-sm mt-1">
              Historien bygges over tid av eier.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-8">
        {events.map((event, index) => {
          const category = event.category as EventCategory;
          const eventType = event.event_type as EventType;
          const displayTitle = event.title || getEventLabel(category, eventType);
          const timeDisplay = formatTimeDisplay(event);
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-12"
            >
              {/* Dot with icon */}
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm">
                {getCategoryIcon(category)}
              </div>
              
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-primary">
                    {timeDisplay}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {getCategoryLabel(category)}
                  </span>
                </div>
                
                <h4 className="text-lg font-semibold">{displayTitle}</h4>
                
                {event.description && (
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    {event.description}
                  </p>
                )}
                
                {event.car_event_images && event.car_event_images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {event.car_event_images
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((img) => (
                        <motion.img
                          key={img.id}
                          src={img.image_url}
                          alt={img.alt_text || displayTitle}
                          className="h-20 w-auto rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                        />
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
