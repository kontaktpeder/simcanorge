CREATE POLICY "Submitters can claim their cars"
ON public.cars
FOR UPDATE
TO authenticated
USING (
  created_by_user_id IS NULL
  AND status = 'submitted'
  AND submitted_by_email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  created_by_user_id = auth.uid()
);

-- Also allow the user to SELECT the car they just claimed
CREATE POLICY "Users can view cars they submitted by email"
ON public.cars
FOR SELECT
TO authenticated
USING (
  submitted_by_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);