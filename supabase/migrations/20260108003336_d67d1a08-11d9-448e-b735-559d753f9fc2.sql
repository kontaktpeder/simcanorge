-- Eksterne lenker for biler
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;

-- Tekniske spesifikasjoner (reservert for fremtid)
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;

-- Geografisk informasjon (reservert for fremtid)
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS geography JSONB DEFAULT '{}'::jsonb;

-- Tidslinje-hendelser (reservert for fremtid)
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS timeline_events JSONB DEFAULT '[]'::jsonb;

-- Kommentarer
COMMENT ON COLUMN public.cars.external_links IS 'Array av eksterne lenker: [{"url": "https://...", "type": "facebook|instagram|youtube|other", "title": "valgfri beskrivelse"}]';
COMMENT ON COLUMN public.cars.technical_specs IS 'Tekniske spesifikasjoner (reservert)';
COMMENT ON COLUMN public.cars.geography IS 'Geografisk informasjon (reservert)';
COMMENT ON COLUMN public.cars.timeline_events IS 'Tidslinje-hendelser for bilens livsløp (reservert)';