DROP POLICY IF EXISTS "Users can view cars they created" ON public.cars;

CREATE POLICY "Users can view cars they created"
ON public.cars
FOR SELECT
TO authenticated
USING (created_by_user_id = auth.uid());