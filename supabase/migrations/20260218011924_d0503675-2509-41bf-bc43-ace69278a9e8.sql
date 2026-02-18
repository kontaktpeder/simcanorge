
-- Add username column
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique index on lowercase trimmed username (only non-empty)
CREATE UNIQUE INDEX IF NOT EXISTS idx_owners_username_unique
  ON public.owners(LOWER(trim(username)))
  WHERE username IS NOT NULL AND trim(username) != '';

-- Migrate: use existing slug as starting username
UPDATE public.owners
SET username = slug
WHERE username IS NULL AND slug IS NOT NULL AND slug != '';

-- Update slug trigger: use username first, else display_name
CREATE OR REPLACE FUNCTION public.generate_owner_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  c INT := 2;
BEGIN
  IF NEW.username IS NOT NULL AND trim(NEW.username) != '' THEN
    base_slug := lower(regexp_replace(
      regexp_replace(regexp_replace(trim(NEW.username), '[æÆ]', 'ae', 'g'), '[øØ]', 'o', 'g'), '[åÅ]', 'a', 'g'
    ));
    base_slug := regexp_replace(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g');
  ELSE
    base_slug := lower(regexp_replace(
      regexp_replace(NEW.display_name, '[æÆ]', 'ae', 'g'), '[øØ]', 'o', 'g'
    ));
    base_slug := lower(regexp_replace(base_slug, '[åÅ]', 'a', 'g'));
    base_slug := regexp_replace(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g');
  END IF;

  IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'profil'; END IF;

  NEW.slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.owners
    WHERE slug = NEW.slug
    AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    NEW.slug := base_slug || '-' || c;
    c := c + 1;
  END LOOP;

  RETURN NEW;
END;
$$;
