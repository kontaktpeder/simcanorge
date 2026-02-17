import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const LIGHTBOX_WIDTH = 1600;

function getLightboxUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: LIGHTBOX_WIDTH, quality: 82 });
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const preloadedRef = useRef<Set<string>>(new Set());

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Eagerly preload ALL images when lightbox opens
      preloadedRef.current = new Set();
      setLoadedUrls(new Set());
      images.forEach((img) => {
        const url = getLightboxUrl(img.url);
        if (!preloadedRef.current.has(url)) {
          preloadedRef.current.add(url);
          const el = new Image();
          el.onload = () => {
            setLoadedUrls((prev) => new Set(prev).add(url));
          };
          el.src = url;
        }
      });
    }
  }, [isOpen, initialIndex, images]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "Escape") onClose();
  };

  if (!isOpen || images.length === 0) return null;

  const currentUrl = getLightboxUrl(images[currentIndex].url);
  const isCurrentLoaded = loadedUrls.has(currentUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
          aria-label="Lukk"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
              aria-label="Forrige bilde"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
              aria-label="Neste bilde"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </>
        )}

        {/* Image – show immediately, fade in smoothly */}
        <img
          key={currentIndex}
          src={currentUrl}
          alt={images[currentIndex].alt || ""}
          className={`max-w-[90vw] max-h-[90vh] object-contain transition-opacity duration-150 ${
            isCurrentLoaded ? "opacity-100" : "opacity-40"
          }`}
          onClick={(e) => e.stopPropagation()}
          onLoad={() => {
            setLoadedUrls((prev) => new Set(prev).add(currentUrl));
          }}
          draggable={false}
        />

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
