-- Allow car owners to create and delete invitations for their own cars
CREATE POLICY "Owners can insert invitations for their cars"
ON public.car_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_invitations.car_id
      AND car_owners.user_id = auth.uid()
      AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can delete invitations for their cars"
ON public.car_invitations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_invitations.car_id
      AND car_owners.user_id = auth.uid()
      AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can view invitations for their cars"
ON public.car_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_invitations.car_id
      AND car_owners.user_id = auth.uid()
      AND car_owners.role = 'owner'
  )
);