import { useState, useEffect } from "react";
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
import { 
  useCreateCarEvent, 
  useUpdateCarEvent, 
  useAddCarEventImage,
  useDeleteCarEventImage,
  type CarEvent, 
  type CreateCarEventInput,
  type CarEventImage
} from "@/hooks/useCarEvents";
import { X, Save, Loader2, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, generateImageId, getCarEventImagePath } from "@/lib/imageCompression";
import { toast } from "sonner";

// Generate year options from 1900 to current year + 5
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear + 5; year >= 1900; year--) {
    years.push(year);
  }
  return years;
};

const YEAR_OPTIONS = generateYearOptions();
const MAX_IMAGES = 3;

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
  
  // Image state
  const [existingImages, setExistingImages] = useState<CarEventImage[]>(
    event?.car_event_images || []
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const createMutation = useCreateCarEvent();
  const updateMutation = useUpdateCarEvent();
  const addImageMutation = useAddCarEventImage();
  const deleteImageMutation = useDeleteCarEventImage();
  
  const isLoading = createMutation.isPending || updateMutation.isPending || isUploadingImages;
  
  const availableEvents = category ? getEventsForCategory(category) : [];
  const totalImageCount = existingImages.length + selectedFiles.length;
  const canAddMore = totalImageCount < MAX_IMAGES;
  
  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
  const handleCategoryChange = (value: string) => {
    setCategory(value as EventCategory);
    setEventType("");
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Calculate how many we can add
    const slotsAvailable = MAX_IMAGES - totalImageCount;
    if (slotsAvailable <= 0) {
      toast.error(`Maksimalt ${MAX_IMAGES} bilder per hendelse`);
      return;
    }
    
    const filesToAdd = files.slice(0, slotsAvailable);
    if (files.length > slotsAvailable) {
      toast.warning(`Bare ${slotsAvailable} bilde${slotsAvailable > 1 ? 'r' : ''} kan legges til`);
    }
    
    // Create preview URLs
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    
    // Reset input
    e.target.value = "";
  };
  
  const handleRemovePreview = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDeleteExistingImage = async (imageId: string) => {
    try {
      await deleteImageMutation.mutateAsync({ imageId, carId });
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Bilde slettet");
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };
  
  const uploadEventImages = async (eventId: string) => {
    if (selectedFiles.length === 0) return;
    
    setIsUploadingImages(true);
    
    for (const file of selectedFiles) {
      try {
        // Compress image
        const compressed = await compressImage(file);
        const imageId = generateImageId();
        const storagePath = getCarEventImagePath(carId, eventId, imageId);
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("simca-images")
          .upload(storagePath, compressed.file, {
            contentType: "image/webp",
            upsert: false,
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("simca-images")
          .getPublicUrl(storagePath);
        
        // Add to database
        await addImageMutation.mutateAsync({
          eventId,
          imageUrl: urlData.publicUrl,
          carId,
        });
      } catch (error) {
        console.error("Failed to upload image:", error);
        toast.error(`Kunne ikke laste opp bilde: ${file.name}`);
      }
    }
    
    setIsUploadingImages(false);
    setSelectedFiles([]);
    setPreviewUrls([]);
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
    
    try {
      let eventId: string;
      
      if (isEditing && event) {
        await updateMutation.mutateAsync({
          id: event.id,
          ...eventData,
        });
        eventId = event.id;
      } else {
        const created = await createMutation.mutateAsync(eventData);
        eventId = created.id;
      }
      
      // Upload new images
      if (selectedFiles.length > 0) {
        await uploadEventImages(eventId);
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
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
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger>
                <SelectValue placeholder="Velg år" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {YEAR_OPTIONS.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearTo">Til år (tom = pågår)</Label>
            <Select value={yearTo} onValueChange={(value) => setYearTo(value === "ongoing" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pågår" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="ongoing">Pågår (ingen sluttdato)</SelectItem>
                {YEAR_OPTIONS.filter((yearOption) => !yearFrom || yearOption >= parseInt(yearFrom, 10)).map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="year">År *</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Velg år" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {YEAR_OPTIONS.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption.toString()}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      
      {/* Image upload section */}
      <div className="space-y-3">
        <Label>Bilder (maks {MAX_IMAGES})</Label>
        
        {/* Existing images (only when editing) */}
        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <img 
                  src={img.image_url} 
                  alt={img.alt_text || ""} 
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteExistingImage(img.id)}
                  disabled={deleteImageMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Preview of new images */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-24 object-cover rounded-lg border border-dashed border-primary/50"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePreview(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-1 rounded">
                  Ny
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* File input */}
        {canAddMore ? (
          <div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Legg til bilder ({totalImageCount}/{MAX_IMAGES})
              </span>
              <Input
                type="file"
                accept="image/*"
                multiple={MAX_IMAGES - totalImageCount > 1}
                onChange={handleImageSelect}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-amber-600">
            Maksimalt {MAX_IMAGES} bilder per hendelse. Fjern et bilde for å legge til et nytt.
          </p>
        )}
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
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isUploadingImages ? "Laster opp bilder..." : "Lagrer..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Lagre" : "Legg til"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
