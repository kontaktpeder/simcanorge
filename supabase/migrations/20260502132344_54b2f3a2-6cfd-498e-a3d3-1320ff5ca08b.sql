-- Allow spotter (creator of a spotting car) to insert public car_events for that car
DROP POLICY IF EXISTS "Spotters can insert public events on their spotting cars" ON public.car_events;
CREATE POLICY "Spotters can insert public events on their spotting cars"
  ON public.car_events FOR INSERT
  TO authenticated
  WITH CHECK (
    visibility = 'public'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cars c
      WHERE c.id = car_events.car_id
        AND c.source = 'spotting'::public.car_source
        AND c.created_by_user_id = auth.uid()
    )
  );

-- Allow spotter to insert images for spotting events on their spotting cars
DROP POLICY IF EXISTS "Spotters can insert images on their spotting events" ON public.car_event_images;
CREATE POLICY "Spotters can insert images on their spotting events"
  ON public.car_event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.car_events ce
      JOIN public.cars c ON c.id = ce.car_id
      WHERE ce.id = car_event_images.car_event_id
        AND c.source = 'spotting'::public.car_source
        AND c.created_by_user_id = auth.uid()
    )
  );