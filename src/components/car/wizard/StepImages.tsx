import { useState, useRef } from "react";
import { Camera, X, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WizardData } from "./WizardTypes";

interface StepImagesProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
}

export function StepImages({ data, onChange, onNext }: StepImagesProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + data.images.length > 10) {
      toast({ title: "Maks 10 bilder", variant: "destructive" });
      return;
    }
    const valid = files.filter(f => {
      if (!f.type.startsWith("image/")) { toast({ title: `${f.name} er ikke et bilde`, variant: "destructive" }); return false; }
      if (f.size > 10 * 1024 * 1024) { toast({ title: `${f.name} er over 10 MB`, variant: "destructive" }); return false; }
      return true;
    });

    const newPreviews: string[] = [];
    let loaded = 0;
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loaded++;
        if (loaded === valid.length) {
          onChange({
            images: [...data.images, ...valid],
            imagePreviews: [...data.imagePreviews, ...newPreviews],
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onChange({
      images: data.images.filter((_, i) => i !== index),
      imagePreviews: data.imagePreviews.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Vis oss bilen din</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Start med bilder – det gjør resten morsommere. Du kan legge til flere senere.
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />

      {data.imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-muted group">
              <img src={preview} alt={`Bilde ${index + 1}`} className="w-full h-full object-cover" />
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                  Hovedbilde
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity min-h-[28px] min-w-[28px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {data.images.length < 10 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 sm:p-12 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-[0.98]"
        >
          <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10">
              {data.images.length === 0 ? <Camera className="w-7 h-7" /> : <ImagePlus className="w-7 h-7" />}
            </div>
            <div className="text-center">
              <p className="font-display text-lg">{data.images.length === 0 ? "Velg bilder" : "Legg til flere"}</p>
              <p className="text-xs sm:text-sm">Maks 10 bilder, 10 MB per bilde</p>
            </div>
          </div>
        </button>
      )}

      <p className="text-xs text-muted-foreground text-center">{data.images.length}/10 bilder valgt</p>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-lg font-display text-base uppercase tracking-wider transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}
        >
          {data.images.length === 0 ? "Hopp over bilder" : "Neste →"}
        </button>
      </div>
    </div>
  );
}
