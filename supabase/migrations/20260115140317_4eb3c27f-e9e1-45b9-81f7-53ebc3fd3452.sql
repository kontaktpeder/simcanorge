-- Drop alle eksisterende relevante policies først
DROP POLICY IF EXISTS "Admins can manage cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;

-- Opprett separate policies for admin (uten INSERT)
CREATE POLICY "Admins can view all cars"
ON public.cars FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cars"
ON public.cars FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cars"
ON public.cars FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Opprett innsendingspolicy med text casting
CREATE POLICY "Anyone can submit cars"
ON public.cars FOR INSERT
TO anon, authenticated
WITH CHECK (
  status::text = 'submitted'
  AND published_at IS NULL
  AND source::text = 'submission'
);