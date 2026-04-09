
-- Join table: explicit car ↔ page links
CREATE TABLE public.page_cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_id, car_id)
);

ALTER TABLE public.page_cars ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "page_cars_public_read" ON public.page_cars
  FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "page_cars_admin_all" ON public.page_cars
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Page owners can insert/delete
CREATE POLICY "page_cars_owner_insert" ON public.page_cars
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = page_cars.page_id
      AND pp.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
  ));

CREATE POLICY "page_cars_owner_delete" ON public.page_cars
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = page_cars.page_id
      AND pp.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
  ));

-- Seed: link ALL currently published cars to Simca Norge
INSERT INTO public.page_cars (page_id, car_id)
SELECT p.id, c.id
FROM pages p
CROSS JOIN cars c
WHERE p.slug = 'simca-norge'
  AND c.published_at IS NOT NULL
  AND c.published_at <= now()
ON CONFLICT DO NOTHING;
