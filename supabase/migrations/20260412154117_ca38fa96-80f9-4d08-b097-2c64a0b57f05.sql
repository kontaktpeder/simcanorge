
-- Valgfritt registreringsnummer på cars
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS registration_number text;

COMMENT ON COLUMN public.cars.registration_number IS
  'Valgfritt norsk registreringsnummer. Brukes til duplikatvarsel, ikke obligatorisk.';

-- Indeks for hurtig oppslag (normalisert)
CREATE INDEX IF NOT EXISTS idx_cars_registration_number_norm
  ON public.cars (lower(trim(registration_number)))
  WHERE registration_number IS NOT NULL AND trim(registration_number) <> '';

-- RPC for duplikatsjekk (begrenset kolonner, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.find_cars_by_registration_number(p_normalized text)
RETURNS TABLE (id uuid, slug text, title text, published_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.title, c.published_at
  FROM public.cars c
  WHERE p_normalized IS NOT NULL
    AND length(p_normalized) >= 2
    AND lower(trim(replace(replace(c.registration_number, ' ', ''), '-', ''))) = p_normalized
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.find_cars_by_registration_number(text) TO authenticated, anon;
