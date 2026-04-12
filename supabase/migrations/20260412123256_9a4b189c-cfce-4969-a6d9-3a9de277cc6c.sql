DROP POLICY IF EXISTS "Admins can view cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;

CREATE POLICY "Admins can view all cars"
ON public.cars
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));