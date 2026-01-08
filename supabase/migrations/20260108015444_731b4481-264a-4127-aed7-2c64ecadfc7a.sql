-- Car events table for tidslinje-hendelser
CREATE TABLE IF NOT EXISTS public.car_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT,
  year INTEGER,
  year_from INTEGER,
  year_to INTEGER,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT car_events_year_or_period CHECK (
    (year IS NOT NULL AND year_from IS NULL AND year_to IS NULL) OR
    (year IS NULL AND year_from IS NOT NULL)
  ),
  CONSTRAINT car_events_year_to_after_from CHECK (
    year_to IS NULL OR year_to >= year_from
  )
);

-- Images for car events
CREATE TABLE IF NOT EXISTS public.car_event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_event_id UUID NOT NULL REFERENCES public.car_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_car_events_car_id ON public.car_events(car_id);
CREATE INDEX IF NOT EXISTS idx_car_events_year ON public.car_events(year);
CREATE INDEX IF NOT EXISTS idx_car_events_year_from ON public.car_events(year_from);
CREATE INDEX IF NOT EXISTS idx_car_event_images_event_id ON public.car_event_images(car_event_id);

-- Updated at trigger
CREATE TRIGGER update_car_events_updated_at 
BEFORE UPDATE ON public.car_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.car_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_event_images ENABLE ROW LEVEL SECURITY;

-- car_events policies
CREATE POLICY "Anyone can view events for published cars"
ON public.car_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_events.car_id
    AND cars.published_at IS NOT NULL
    AND cars.published_at <= now()
  )
);

CREATE POLICY "Owners can view their car events"
ON public.car_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_events.car_id
    AND car_owners.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can insert car events"
ON public.car_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_events.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can update their car events"
ON public.car_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_events.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can delete their car events"
ON public.car_events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_events.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Admins can manage all car events"
ON public.car_events FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- car_event_images policies
CREATE POLICY "Anyone can view images for published car events"
ON public.car_event_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_events
    JOIN public.cars ON cars.id = car_events.car_id
    WHERE car_events.id = car_event_images.car_event_id
    AND cars.published_at IS NOT NULL
    AND cars.published_at <= now()
  )
);

CREATE POLICY "Owners can view their car event images"
ON public.car_event_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_events
    JOIN public.car_owners ON car_owners.car_id = car_events.car_id
    WHERE car_events.id = car_event_images.car_event_id
    AND car_owners.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can insert car event images"
ON public.car_event_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_events
    JOIN public.car_owners ON car_owners.car_id = car_events.car_id
    WHERE car_events.id = car_event_images.car_event_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can update their car event images"
ON public.car_event_images FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.car_events
    JOIN public.car_owners ON car_owners.car_id = car_events.car_id
    WHERE car_events.id = car_event_images.car_event_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Owners can delete their car event images"
ON public.car_event_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.car_events
    JOIN public.car_owners ON car_owners.car_id = car_events.car_id
    WHERE car_events.id = car_event_images.car_event_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
);

CREATE POLICY "Admins can manage all car event images"
ON public.car_event_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));