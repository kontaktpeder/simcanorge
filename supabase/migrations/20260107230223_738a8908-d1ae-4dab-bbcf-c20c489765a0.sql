-- Ytterligere innsendingsfelter på cars
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS submitted_by_phone TEXT,
ADD COLUMN IF NOT EXISTS submitted_notes TEXT,
ADD COLUMN IF NOT EXISTS submission_payload JSONB;

-- Kommentarer
COMMENT ON COLUMN public.cars.submitted_by_phone IS 'Telefonnummer fra innsender (snapshot)';
COMMENT ON COLUMN public.cars.submitted_notes IS 'Notater/melding fra innsender (snapshot)';
COMMENT ON COLUMN public.cars.submission_payload IS 'Komplett innsendingsdata som JSON (skalerbart)';