-- Create owners table for owner profiles
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  favorite_brands TEXT[],
  visible_public BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_owners_user_id ON public.owners(user_id);
CREATE INDEX idx_owners_slug ON public.owners(slug);
CREATE INDEX idx_owners_visible_public ON public.owners(visible_public) WHERE visible_public = true;

-- Trigger for updated_at
CREATE TRIGGER update_owners_updated_at
BEFORE UPDATE ON public.owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate slug from display_name
CREATE OR REPLACE FUNCTION public.generate_owner_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(
      regexp_replace(NEW.display_name, '[æÆ]', 'ae', 'g'),
      '[øØ]', 'o', 'g'
    ));
    NEW.slug := lower(regexp_replace(NEW.slug, '[åÅ]', 'a', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9]+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '^-|-$', '', 'g');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.owners WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER owners_generate_slug
BEFORE INSERT OR UPDATE ON public.owners
FOR EACH ROW
EXECUTE FUNCTION public.generate_owner_slug();

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can view visible owner profiles
CREATE POLICY "Public can view visible owner profiles"
ON public.owners FOR SELECT
TO public
USING (visible_public = true);

-- Owners can view their own profile (regardless of visible_public)
CREATE POLICY "Owners can view their own profile"
ON public.owners FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owners can insert their own profile
CREATE POLICY "Owners can insert their own profile"
ON public.owners FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Owners can update their own profile
CREATE POLICY "Owners can update their own profile"
ON public.owners FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins can manage all owner profiles"
ON public.owners
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));