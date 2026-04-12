-- Drop and recreate with simplified conditions
DROP POLICY IF EXISTS "Authenticated users can create own draft cars" ON public.cars;

CREATE POLICY "Authenticated users can create own draft cars"
ON public.cars
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND source = 'owner_self'
  AND published_at IS NULL
);