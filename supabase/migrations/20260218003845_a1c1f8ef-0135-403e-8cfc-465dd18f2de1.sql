
-- 1) Add slug column to parts
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs from title
UPDATE public.parts
SET slug = lower(regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[æÆ]', 'ae', 'g'),
    '[øØ]', 'o', 'g'),
  '[åÅ]', 'a', 'g'),
'[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Clean leading/trailing dashes
UPDATE public.parts
SET slug = regexp_replace(regexp_replace(slug, '^-+|-+$', '', 'g'), '--+', '-', 'g')
WHERE slug IS NOT NULL AND slug != '';

-- Ensure uniqueness by appending suffix where needed
DO $$
DECLARE
  r RECORD;
  c INT;
  base TEXT;
BEGIN
  FOR r IN
    SELECT id, slug FROM public.parts WHERE slug IS NOT NULL AND slug != ''
    ORDER BY created_at
  LOOP
    IF EXISTS (SELECT 1 FROM public.parts WHERE slug = r.slug AND id != r.id) THEN
      base := r.slug;
      c := 2;
      WHILE EXISTS (SELECT 1 FROM public.parts WHERE slug = base || '-' || c AND id != r.id) LOOP
        c := c + 1;
      END LOOP;
      UPDATE public.parts SET slug = base || '-' || c WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.generate_part_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  c INT := 2;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(regexp_replace(NEW.title, '[æÆ]', 'ae', 'g'), '[øØ]', 'o', 'g'), '[åÅ]', 'a', 'g'));
    base_slug := regexp_replace(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g');
    IF base_slug = '' THEN base_slug := 'del'; END IF;
    NEW.slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.parts WHERE slug = NEW.slug AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := base_slug || '-' || c;
      c := c + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER parts_generate_slug
BEFORE INSERT OR UPDATE ON public.parts
FOR EACH ROW EXECUTE FUNCTION public.generate_part_slug();

CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_slug ON public.parts(slug) WHERE slug IS NOT NULL AND slug != '';

-- 2) Add marketplace_item_id to inquiry_items
ALTER TABLE public.inquiry_items ADD COLUMN IF NOT EXISTS marketplace_item_id UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL;

-- Make part_id nullable (it was already nullable per schema but ensure)
ALTER TABLE public.inquiry_items ALTER COLUMN part_id DROP NOT NULL;

-- Add check constraint: at least one of part_id or marketplace_item_id must be set
-- Using a trigger instead of CHECK for flexibility
CREATE OR REPLACE FUNCTION public.validate_inquiry_item_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.part_id IS NULL AND NEW.marketplace_item_id IS NULL THEN
    RAISE EXCEPTION 'Either part_id or marketplace_item_id must be set';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_inquiry_item_source_trigger
BEFORE INSERT OR UPDATE ON public.inquiry_items
FOR EACH ROW EXECUTE FUNCTION public.validate_inquiry_item_source();
