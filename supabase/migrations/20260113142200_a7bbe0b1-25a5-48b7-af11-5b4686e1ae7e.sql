-- Drop and recreate with explicit roles for anon and authenticated
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;

-- Explicitly grant to both anon and authenticated roles
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'submitted' 
  AND published_at IS NULL 
  AND source = 'submission'
);