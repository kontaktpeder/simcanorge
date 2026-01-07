-- Add approval columns to cars table
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Comments for documentation
COMMENT ON COLUMN public.cars.approved_at IS 'When the car was approved by admin';
COMMENT ON COLUMN public.cars.approved_by IS 'Admin who approved the car';

-- Update car_invitations policy to only allow inserts for approved cars
DROP POLICY IF EXISTS "Admins can manage car_invitations" ON public.car_invitations;

CREATE POLICY "Admins can insert invitations for approved cars"
ON public.car_invitations FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_invitations.car_id
    AND cars.approved_at IS NOT NULL
  )
);

CREATE POLICY "Admins can update car_invitations"
ON public.car_invitations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete car_invitations"
ON public.car_invitations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));