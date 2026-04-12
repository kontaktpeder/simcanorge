
DROP POLICY IF EXISTS "Car creators can view images of their cars" ON public.car_images;

CREATE POLICY "Car creators can view images of their cars"
ON public.car_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.cars c
    WHERE c.id = car_images.car_id
      AND c.created_by_user_id = auth.uid()
  )
);
