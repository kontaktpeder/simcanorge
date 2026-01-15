-- Drop eksisterende policy
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;

-- Opprett ny policy med eksplisitt enum-casting
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (status = 'submitted'::public.car_status)
  AND published_at IS NULL
  AND (source = 'submission'::public.car_source)
);