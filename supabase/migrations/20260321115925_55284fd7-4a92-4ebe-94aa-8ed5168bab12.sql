CREATE POLICY "Admins can insert car images"
ON public.car_images FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));