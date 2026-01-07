import { Progress } from "@/components/ui/progress";
import { formatFileSize, type CompressionProgress } from "@/lib/imageCompression";
import { Loader2 } from "lucide-react";

interface ImageUploadProgressProps {
  progress: CompressionProgress | null;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    reduction: number;
  } | null;
}

export function ImageUploadProgress({ progress, compressionStats }: ImageUploadProgressProps) {
  if (!progress) return null;

  const getMessage = () => {
    if (progress.stage === 'compressing') {
      return `Komprimerer bilde ${progress.current} av ${progress.total}...`;
    }
    return `Laster opp bilde ${progress.current} av ${progress.total}...`;
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm font-medium">{getMessage()}</span>
      </div>
      
      <Progress value={progress.percentage} className="h-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress.percentage}% fullført</span>
        <span>{progress.current}/{progress.total} bilder</span>
      </div>

      {compressionStats && compressionStats.reduction > 0 && (
        <div className="text-xs text-green-600 font-medium">
          {formatFileSize(compressionStats.originalSize)} → {formatFileSize(compressionStats.compressedSize)} 
          {' '}({compressionStats.reduction}% reduksjon)
        </div>
      )}
    </div>
  );
}
