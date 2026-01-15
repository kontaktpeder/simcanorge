-- Make submission policies apply regardless of JWT role mapping by using TO public
-- (Still constrained by WITH CHECK conditions)

DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
TO public
WITH CHECK (
  source = 'submission'::public.car_source
  AND status = 'submitted'::public.car_status
  AND published_at IS NULL
  AND approved_at IS NULL
  AND approved_by IS NULL
);

DROP POLICY IF EXISTS "Anyone can add images to submitted cars" ON public.car_images;
CREATE POLICY "Anyone can add images to submitted cars"
ON public.car_images
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cars
    WHERE cars.id = car_images.car_id
      AND cars.source = 'submission'::public.car_source
      AND cars.status = 'submitted'::public.car_status
  )
);

-- Fix linter WARN: set immutable search_path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_page_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.page_views WHERE created_at < now() - interval '30 days';
END;
$function$;
