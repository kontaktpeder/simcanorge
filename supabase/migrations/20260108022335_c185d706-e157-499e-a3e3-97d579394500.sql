-- Create function to enforce max 3 images per car event
CREATE OR REPLACE FUNCTION public.check_max_event_images()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.car_event_images WHERE car_event_id = NEW.car_event_id) >= 3 THEN
    RAISE EXCEPTION 'Maksimalt 3 bilder per hendelse er tillatt';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS check_max_event_images_trigger ON public.car_event_images;

-- Create trigger to enforce limit
CREATE TRIGGER check_max_event_images_trigger
BEFORE INSERT ON public.car_event_images
FOR EACH ROW EXECUTE FUNCTION public.check_max_event_images();