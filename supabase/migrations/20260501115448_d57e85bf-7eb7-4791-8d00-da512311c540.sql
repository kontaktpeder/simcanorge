DROP POLICY IF EXISTS "Authenticated users can create spotting cars" ON public.cars;
CREATE POLICY "Authenticated users can create spotting cars"
  ON public.cars FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND source = 'spotting'::public.car_source
    AND published_at IS NULL
  );