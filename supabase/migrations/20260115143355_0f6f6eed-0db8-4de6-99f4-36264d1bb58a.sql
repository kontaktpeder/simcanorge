-- Fix RLS policy for car_images to explicitly include anon role
DROP POLICY IF EXISTS "Anyone can add images to submitted cars" ON public.car_images;

CREATE POLICY "Anyone can add images to submitted cars"
ON public.car_images FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_images.car_id
    AND cars.status = 'submitted'::public.car_status
    AND cars.source = 'submission'::public.car_source
  )
);