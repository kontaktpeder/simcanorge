-- Fix RLS policy to use proper enum casting instead of text casting
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;

CREATE POLICY "Anyone can submit cars"
ON public.cars FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'submitted'::public.car_status
  AND published_at IS NULL
  AND source = 'submission'::public.car_source
);