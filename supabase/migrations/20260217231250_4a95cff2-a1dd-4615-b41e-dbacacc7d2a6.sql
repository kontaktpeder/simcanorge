
-- A) Utvid owners med avatar_url og approved_at
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- B) Oppdater public visibility policy til å kreve approved_at
DROP POLICY IF EXISTS "Public can view visible owner profiles" ON public.owners;
CREATE POLICY "Public can view visible approved owner profiles"
ON public.owners FOR SELECT TO public
USING (visible_public = true AND approved_at IS NOT NULL);

-- C) marketplace_categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON public.marketplace_categories(slug);

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read marketplace_categories" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage marketplace_categories" ON public.marketplace_categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- D) marketplace_items
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12,2),
  price_note TEXT,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  location TEXT,
  contact_mode TEXT NOT NULL DEFAULT 'form_only',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_owner ON public.marketplace_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_slug ON public.marketplace_items(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_published ON public.marketplace_items(published_at) WHERE published_at IS NOT NULL;

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published marketplace_items"
ON public.marketplace_items FOR SELECT
USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Owners can view own marketplace_items"
ON public.marketplace_items FOR SELECT TO authenticated
USING ((SELECT user_id FROM public.owners WHERE id = owner_id) = auth.uid());

CREATE POLICY "Owners can insert own marketplace_items"
ON public.marketplace_items FOR INSERT TO authenticated
WITH CHECK ((SELECT user_id FROM public.owners WHERE id = owner_id) = auth.uid());

CREATE POLICY "Owners can update own marketplace_items"
ON public.marketplace_items FOR UPDATE TO authenticated
USING ((SELECT user_id FROM public.owners WHERE id = owner_id) = auth.uid())
WITH CHECK ((SELECT user_id FROM public.owners WHERE id = owner_id) = auth.uid());

CREATE POLICY "Owners can delete own marketplace_items"
ON public.marketplace_items FOR DELETE TO authenticated
USING ((SELECT user_id FROM public.owners WHERE id = owner_id) = auth.uid());

CREATE POLICY "Admins manage marketplace_items"
ON public.marketplace_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- E) marketplace_images
CREATE TABLE IF NOT EXISTS public.marketplace_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_images_item ON public.marketplace_images(item_id);

ALTER TABLE public.marketplace_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view images of published items"
ON public.marketplace_images FOR SELECT
USING (EXISTS (SELECT 1 FROM public.marketplace_items m WHERE m.id = item_id AND m.published_at IS NOT NULL AND m.published_at <= now()));

CREATE POLICY "Owners can view images of own items"
ON public.marketplace_images FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.marketplace_items m JOIN public.owners o ON o.id = m.owner_id WHERE m.id = item_id AND o.user_id = auth.uid()));

CREATE POLICY "Owners can insert images of own items"
ON public.marketplace_images FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_items m JOIN public.owners o ON o.id = m.owner_id WHERE m.id = item_id AND o.user_id = auth.uid()));

CREATE POLICY "Owners can update images of own items"
ON public.marketplace_images FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.marketplace_items m JOIN public.owners o ON o.id = m.owner_id WHERE m.id = item_id AND o.user_id = auth.uid()));

CREATE POLICY "Owners can delete images of own items"
ON public.marketplace_images FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.marketplace_items m JOIN public.owners o ON o.id = m.owner_id WHERE m.id = item_id AND o.user_id = auth.uid()));

CREATE POLICY "Admins manage marketplace_images"
ON public.marketplace_images FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- F) Slug-trigger for marketplace_items
CREATE OR REPLACE FUNCTION public.generate_marketplace_item_slug()
RETURNS TRIGGER AS $$
DECLARE base_slug TEXT; c INT := 2;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(regexp_replace(NEW.title, '[æÆ]', 'ae', 'g'), '[øØ]', 'o', 'g'), '[åÅ]', 'a', 'g'));
    base_slug := regexp_replace(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g'), '^-|-$', '', 'g');
    IF base_slug = '' THEN base_slug := 'item'; END IF;
    NEW.slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.marketplace_items WHERE slug = NEW.slug AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := base_slug || '-' || c; c := c + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER marketplace_items_generate_slug 
BEFORE INSERT OR UPDATE ON public.marketplace_items 
FOR EACH ROW EXECUTE FUNCTION public.generate_marketplace_item_slug();

-- G) Updated_at triggers
CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_categories_updated_at
BEFORE UPDATE ON public.marketplace_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- H) Validation trigger for contact_mode and status (instead of CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_marketplace_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_mode NOT IN ('form_only', 'show_contact') THEN
    RAISE EXCEPTION 'Invalid contact_mode: %', NEW.contact_mode;
  END IF;
  IF NEW.status NOT IN ('draft', 'submitted', 'published', 'archived') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_marketplace_item_trigger
BEFORE INSERT OR UPDATE ON public.marketplace_items
FOR EACH ROW EXECUTE FUNCTION public.validate_marketplace_item();
