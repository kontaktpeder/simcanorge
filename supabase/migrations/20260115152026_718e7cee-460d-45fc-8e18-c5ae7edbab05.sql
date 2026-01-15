-- Fix RLS: allow car submissions for anon + authenticated, and set correct admin policies

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Clean up any previous versions
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can manage cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can view cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;

-- Public submission INSERT
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
TO anon, authenticated
WITH CHECK (
  source = 'submission'::public.car_source
  AND status = 'submitted'::public.car_status
  AND published_at IS NULL
  AND approved_at IS NULL
  AND approved_by IS NULL
);

-- Admin management (note: public.has_role signature is (_user_id uuid, _role app_role))
CREATE POLICY "Admins can view cars"
ON public.cars
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update cars"
ON public.cars
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete cars"
ON public.cars
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure images can be attached to submitted submission-cars
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can add images to submitted cars" ON public.car_images;

CREATE POLICY "Anyone can add images to submitted cars"
ON public.car_images
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cars
    WHERE cars.id = car_images.car_id
      AND cars.source = 'submission'::public.car_source
      AND cars.status = 'submitted'::public.car_status
  )
);
