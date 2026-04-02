ALTER TABLE public.event_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

COMMENT ON COLUMN public.event_images.storage_path
  IS 'Supabase Storage path used for deletion, e.g. events/{eventId}/images/{imageId}/original.webp';