DROP POLICY IF EXISTS "Submitters can claim their cars" ON public.cars;
DROP POLICY IF EXISTS "Users can view cars they submitted by email" ON public.cars;

CREATE POLICY "Submitters can claim their cars"
ON public.cars
FOR UPDATE
TO authenticated
USING (
  created_by_user_id IS NULL
  AND status = 'submitted'
  AND lower(coalesce(submitted_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  created_by_user_id = auth.uid()
  AND lower(coalesce(submitted_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

CREATE POLICY "Users can view cars they submitted by email"
ON public.cars
FOR SELECT
TO authenticated
USING (
  lower(coalesce(submitted_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);