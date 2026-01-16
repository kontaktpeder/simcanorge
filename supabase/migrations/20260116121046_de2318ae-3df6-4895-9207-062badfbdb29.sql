-- Fiks 1: Admin kan se alle bilder (uavhengig av bilens status)
DROP POLICY IF EXISTS "Admins can view all car images" ON public.car_images;

CREATE POLICY "Admins can view all car images"
ON public.car_images FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Fiks 2: Eiere kan laste opp bilder til sine biler (uavhengig av bilens status)
DROP POLICY IF EXISTS "Owners can insert images to their cars" ON public.car_images;

CREATE POLICY "Owners can insert images to their cars"
ON public.car_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_images.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

-- Fiks 3: Eiere kan oppdatere bilder på sine biler
DROP POLICY IF EXISTS "Owners can update images of their cars" ON public.car_images;

CREATE POLICY "Owners can update images of their cars"
ON public.car_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_images.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_images.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

-- Fiks 4: Eiere kan slette bilder på sine biler
DROP POLICY IF EXISTS "Owners can delete images of their cars" ON public.car_images;

CREATE POLICY "Owners can delete images of their cars"
ON public.car_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_images.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

-- Fiks 5: Admin kan også oppdatere og slette bilder
DROP POLICY IF EXISTS "Admins can update car images" ON public.car_images;
DROP POLICY IF EXISTS "Admins can delete car images" ON public.car_images;
DROP POLICY IF EXISTS "Admins can manage car images" ON public.car_images;

CREATE POLICY "Admins can update car images"
ON public.car_images FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete car images"
ON public.car_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));