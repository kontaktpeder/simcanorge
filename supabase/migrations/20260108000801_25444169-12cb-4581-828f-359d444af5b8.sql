-- Redigeringsgodkjenning fra innsending
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS allow_edits BOOLEAN;

-- Kommentar
COMMENT ON COLUMN public.cars.allow_edits IS 'Godkjenning fra innsender om redigering er tillatt (snapshot fra innsending)';