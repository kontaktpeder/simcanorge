-- Add editorial_status field for admin curation
-- This overrides automatic module selection
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS editorial_status TEXT CHECK (editorial_status IN ('arkiv', 'omtalt', 'utvalgt', 'manedens_bil'));

-- Add comment for documentation
COMMENT ON COLUMN public.cars.editorial_status IS 'Admin-only editorial status: arkiv, omtalt, utvalgt, manedens_bil. Overrides automatic module selection.';