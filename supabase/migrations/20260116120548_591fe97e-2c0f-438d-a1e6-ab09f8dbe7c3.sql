-- Sørg for at admin kan se alle car_images
DROP POLICY IF EXISTS "Admins can view all car images" ON public.car_images;

CREATE POLICY "Admins can view all car images"
ON public.car_images FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Sørg også for at admin kan oppdatere og slette bilder
DROP POLICY IF EXISTS "Admins can manage car images" ON public.car_images;

DROP POLICY IF EXISTS "Admins can update car images" ON public.car_images;
CREATE POLICY "Admins can update car images"
ON public.car_images FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete car images" ON public.car_images;
CREATE POLICY "Admins can delete car images"
ON public.car_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));