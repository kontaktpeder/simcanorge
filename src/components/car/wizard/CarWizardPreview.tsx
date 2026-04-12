import { useMemo } from "react";
import { generateCarTitle } from "@/data/carBrands";
import type { WizardData } from "./WizardTypes";

interface CarWizardPreviewProps {
  data: WizardData;
}

export function CarWizardPreview({ data }: CarWizardPreviewProps) {
  const title = useMemo(() => {
    if (!data.brand || !data.car_model) return null;
    return generateCarTitle(data.brand, data.car_model, data.car_year ? parseInt(data.car_year) : null);
  }, [data.brand, data.car_model, data.car_year]);

  const heroImage = data.imagePreviews[0] ?? null;
  const hasContent = title || heroImage || data.car_story.trim();

  if (!hasContent) return null;

  return (
    <div className="rounded-xl border border-muted overflow-hidden bg-card shadow-lg">
      <div className="px-3 py-2 bg-muted/50 border-b border-muted">
        <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Forhåndsvisning</p>
      </div>

      {/* Hero image */}
      {heroImage && (
        <div className="aspect-[16/9] relative overflow-hidden bg-muted">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {title && (
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-display text-white text-lg sm:text-xl leading-tight drop-shadow-lg">{title}</p>
              {data.car_year && (
                <p className="text-white/70 text-sm mt-0.5">{data.car_year}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text-only title */}
      {!heroImage && title && (
        <div className="px-4 pt-4">
          <p className="font-display text-xl text-foreground">{title}</p>
          {data.car_year && <p className="text-muted-foreground text-sm">{data.car_year}</p>}
        </div>
      )}

      {/* Story excerpt */}
      {data.car_story.trim() && (
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-line">
            {data.car_story.slice(0, 300)}{data.car_story.length > 300 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Tags */}
      {data.tags.trim() && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {data.tags.split(",").filter(t => t.trim()).slice(0, 5).map((tag, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Extra images */}
      {data.imagePreviews.length > 1 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {data.imagePreviews.slice(1, 5).map((img, i) => (
            <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-muted" />
          ))}
          {data.imagePreviews.length > 5 && (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xs text-muted-foreground font-bold">
              +{data.imagePreviews.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
