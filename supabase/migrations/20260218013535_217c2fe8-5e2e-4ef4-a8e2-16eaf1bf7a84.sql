
-- 1) Legg til hovedkategorier «Deler» og «Samleobjekter» som røtter
-- Flytt eksisterende toppkategorier inn under «Deler»

DO $$
DECLARE
  deler_id UUID;
  samle_id UUID;
BEGIN
  -- Opprett Deler-rot
  INSERT INTO public.categories (id, name, slug, parent_id, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Deler', 'deler', NULL, now(), now())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO deler_id FROM public.categories WHERE slug = 'deler' AND parent_id IS NULL LIMIT 1;
  
  -- Opprett Samleobjekter-rot
  INSERT INTO public.categories (id, name, slug, parent_id, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Samleobjekter', 'samleobjekter', NULL, now(), now())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO samle_id FROM public.categories WHERE slug = 'samleobjekter' AND parent_id IS NULL LIMIT 1;

  -- Flytt alle eksisterende toppkategorier under Deler
  UPDATE public.categories
  SET parent_id = deler_id
  WHERE parent_id IS NULL
    AND id != deler_id
    AND id != samle_id;
END $$;
