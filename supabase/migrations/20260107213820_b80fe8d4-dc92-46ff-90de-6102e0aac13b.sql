-- RLS policies for car owners to update their cars and manage images

-- Owners can update their cars (all fields including status)
CREATE POLICY "Owners can update their cars"
ON public.cars FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = cars.id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = cars.id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

-- Owners can view images of their cars
CREATE POLICY "Owners can view images of their cars"
ON public.car_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_images.car_id
    AND car_owners.user_id = auth.uid()
  )
);

-- Owners can insert images to their cars
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

-- Owners can update images of their cars
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

-- Owners can delete images of their cars
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