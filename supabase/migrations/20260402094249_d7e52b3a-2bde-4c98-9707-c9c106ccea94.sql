
-- 1. Add new columns to person_profiles
ALTER TABLE public.person_profiles
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS favorite_brands text[],
  ADD COLUMN IF NOT EXISTS visible_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS requested_approval_at timestamptz;

-- 2. Add person_profile_id to marketplace_items
ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS person_profile_id uuid REFERENCES public.person_profiles(id);

-- 3. Copy existing owner data into person_profiles where both exist
UPDATE public.person_profiles pp
SET
  contact_email = COALESCE(pp.contact_email, o.contact_email),
  contact_phone = COALESCE(pp.contact_phone, o.contact_phone),
  favorite_brands = COALESCE(pp.favorite_brands, o.favorite_brands),
  visible_public = o.visible_public,
  approved_at = o.approved_at,
  requested_approval_at = o.requested_approval_at
FROM public.owners o
WHERE o.user_id = pp.user_id;

-- 4. Backfill person_profile_id on marketplace_items from owners
UPDATE public.marketplace_items mi
SET person_profile_id = pp.id
FROM public.owners o
JOIN public.person_profiles pp ON pp.user_id = o.user_id
WHERE mi.owner_id = o.id
  AND mi.person_profile_id IS NULL;
