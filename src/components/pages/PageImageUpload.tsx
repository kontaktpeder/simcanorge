import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label: string;
  currentUrl: string | null | undefined;
  storagePath: string;
  aspectClass?: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

export function PageImageUpload({
  label,
  currentUrl,
  storagePath,
  aspectClass = "aspect-video",
  onUploaded,
  onRemoved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { file: compressed } = await compressImage(file);
      const { error } = await supabase.storage
        .from("simca-images")
        .upload(storagePath, compressed, {
          contentType: "image/webp",
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage
        .from("simca-images")
        .getPublicUrl(storagePath);
      onUploaded(`${data.publicUrl}?t=${Date.now()}`);
      toast.success(`${label} lastet opp`);
    } catch (err: any) {
      toast.error(err.message ?? "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div
        className={`relative ${aspectClass} w-full rounded-lg overflow-hidden border border-border bg-muted/30 cursor-pointer group`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded-md hover:bg-white/90"
              >
                <ImagePlus className="w-3.5 h-3.5 inline mr-1" />
                Bytt bilde
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoved(); }}
                className="px-3 py-1.5 bg-white/20 text-white text-xs font-medium rounded-md hover:bg-white/30 border border-white/30"
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                Fjern
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <p className="text-xs">Klikk for å laste opp</p>
              </>
            )}
          </div>
        )}
        {uploading && currentUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
