CREATE OR REPLACE FUNCTION public.can_attach_submission_image(_car_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cars c
    WHERE c.id = _car_id
      AND c.source = 'submission'::public.car_source
      AND c.status = 'submitted'::public.car_status
      AND c.published_at IS NULL
      AND c.created_by_user_id IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.can_attach_submission_image(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_attach_submission_image(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can add images to submitted cars" ON public.car_images;

CREATE POLICY "Anyone can add images to submitted cars"
ON public.car_images
FOR INSERT
TO public
WITH CHECK (public.can_attach_submission_image(car_id));