-- Owners can view their own cars (regardless of published status)
CREATE POLICY "Owners can view their cars"
ON public.cars FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = cars.id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);