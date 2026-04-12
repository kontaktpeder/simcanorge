-- Drop and recreate the INSERT policy for owner_self cars with simplified check
DROP POLICY IF EXISTS "Authenticated users can create own draft cars" ON public.cars;

CREATE POLICY "Authenticated users can create own draft cars"
ON public.cars
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND source = 'owner_self'::car_source
  AND status IN ('draft'::car_status, 'submitted'::car_status)
  AND published_at IS NULL
  AND approved_at IS NULL
  AND approved_by IS NULL
);