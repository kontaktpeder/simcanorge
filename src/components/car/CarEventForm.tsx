import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EVENT_CATEGORIES,
  getAllCategories,
  getEventsForCategory,
  getEventLabel,
  type EventCategory,
  type EventType,
} from "@/data/carEventCategories";
import { useCreateCarEvent, useUpdateCarEvent, type CarEvent, type CreateCarEventInput } from "@/hooks/useCarEvents";
import { X, Save, Loader2 } from "lucide-react";

interface CarEventFormProps {
  carId: string;
  event?: CarEvent;
  onClose: () => void;
}

export function CarEventForm({ carId, event, onClose }: CarEventFormProps) {
  const isEditing = !!event;
  
  const [category, setCategory] = useState<EventCategory | "">(
    (event?.category as EventCategory) || ""
  );
  const [eventType, setEventType] = useState<EventType | "">(
    (event?.event_type as EventType) || ""
  );
  const [title, setTitle] = useState(event?.title || "");
  const [isPeriod, setIsPeriod] = useState(event ? !event.year : false);
  const [year, setYear] = useState(event?.year?.toString() || "");
  const [yearFrom, setYearFrom] = useState(event?.year_from?.toString() || "");
  const [yearTo, setYearTo] = useState(event?.year_to?.toString() || "");
  const [description, setDescription] = useState(event?.description || "");

  const createMutation = useCreateCarEvent();
  const updateMutation = useUpdateCarEvent();
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  const availableEvents = category ? getEventsForCategory(category) : [];
  
  const handleCategoryChange = (value: string) => {
    setCategory(value as EventCategory);
    setEventType("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !eventType) {
      return;
    }
    
    const eventData: CreateCarEventInput = {
      car_id: carId,
      category,
      event_type: eventType,
      title: title || null,
      description: description || null,
      year: null,
      year_from: null,
      year_to: null,
    };
    
    if (isPeriod) {
      eventData.year_from = yearFrom ? parseInt(yearFrom, 10) : null;
      eventData.year_to = yearTo ? parseInt(yearTo, 10) : null;
    } else {
      eventData.year = year ? parseInt(year, 10) : null;
    }
    
    // Validate: must have year or year_from
    if (!eventData.year && !eventData.year_from) {
      return;
    }
    
    if (isEditing && event) {
      await updateMutation.mutateAsync({
        id: event.id,
        ...eventData,
      });
    } else {
      await createMutation.mutateAsync(eventData);
    }
    
    onClose();
  };
  
  const autoTitle = category && eventType 
    ? getEventLabel(category, eventType)
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Rediger hendelse" : "Ny hendelse"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              {getAllCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {EVENT_CATEGORIES[cat].icon} {EVENT_CATEGORIES[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="eventType">Hendelse *</Label>
          <Select 
            value={eventType} 
            onValueChange={(v) => setEventType(v as EventType)}
            disabled={!category}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg hendelse" />
            </SelectTrigger>
            <SelectContent>
              {availableEvents.map((evt) => (
                <SelectItem key={evt} value={evt}>
                  {getEventLabel(category as EventCategory, evt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">Tittel (valgfritt)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={autoTitle || "Auto-genereres fra hendelsestype"}
        />
        <p className="text-xs text-muted-foreground">
          La stå tom for å bruke standard tittel: "{autoTitle}"
        </p>
      </div>
      
      <div className="flex items-center gap-3 py-2">
        <Switch
          id="isPeriod"
          checked={isPeriod}
          onCheckedChange={setIsPeriod}
        />
        <Label htmlFor="isPeriod" className="cursor-pointer">
          Periode (fra–til) i stedet for enkeltår
        </Label>
      </div>
      
      {isPeriod ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="yearFrom">Fra år *</Label>
            <Input
              id="yearFrom"
              type="number"
              min="1900"
              max="2100"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="1970"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearTo">Til år (tom = pågår)</Label>
            <Input
              id="yearTo"
              type="number"
              min="1900"
              max="2100"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="1985"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="year">År *</Label>
          <Input
            id="year"
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1972"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Legg til detaljer om denne hendelsen..."
          rows={3}
        />
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Avbryt
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isLoading || !category || !eventType || (!year && !yearFrom)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditing ? "Lagre" : "Legg til"}
        </Button>
      </div>
    </form>
  );
}
