-- Allow anyone to insert car_images for submitted cars
CREATE POLICY "Anyone can add images to submitted cars"
ON public.car_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cars 
    WHERE cars.id = car_id 
    AND cars.status = 'submitted' 
    AND cars.source = 'submission'
  )
);