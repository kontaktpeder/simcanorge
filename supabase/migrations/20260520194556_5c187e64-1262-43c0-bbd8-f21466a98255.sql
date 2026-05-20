-- A) Backfill existing spotting cars
UPDATE public.cars
SET
  published_at = COALESCE(published_at, created_at, now()),
  status = CASE
    WHEN status IN ('draft', 'submitted') THEN 'published'::public.car_status
    ELSE status
  END,
  slug = COALESCE(
    NULLIF(btrim(slug), ''),
    'spotting-' || substring(replace(id::text, '-', '') from 1 for 12)
  )
WHERE source = 'spotting'::public.car_source
  AND published_at IS NULL;

-- B) Replace public listing policy for unknown spotting cars
DROP POLICY IF EXISTS "Public can list unknown identification cars" ON public.cars;

CREATE POLICY "Public can list unknown identification cars"
  ON public.cars
  FOR SELECT
  TO anon, authenticated
  USING (
    source = 'spotting'::public.car_source
    AND identification_status IN (
      'unknown'::public.car_identification_status,
      'needs_review'::public.car_identification_status
    )
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

-- C) RPC: publish car on observation
CREATE OR REPLACE FUNCTION public.publish_car_on_observation(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  fallback_slug text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, slug, published_at, status
  INTO c
  FROM public.cars
  WHERE id = p_car_id;

  IF c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF c.published_at IS NOT NULL AND c.published_at <= now() THEN
    RETURN jsonb_build_object(
      'ok', true,
      'slug', c.slug,
      'already_published', true
    );
  END IF;

  fallback_slug := 'bil-' || substring(replace(c.id::text, '-', '') from 1 for 12)
    || '-' || floor(extract(epoch from now()))::bigint;

  PERFORM set_config('app.publish_on_observation', 'true', true);

  UPDATE public.cars
  SET
    published_at = now(),
    status = CASE
      WHEN status IN ('draft', 'submitted') THEN 'published'::public.car_status
      ELSE status
    END,
    slug = COALESCE(NULLIF(btrim(slug), ''), fallback_slug)
  WHERE id = p_car_id
  RETURNING slug, published_at INTO c;

  RETURN jsonb_build_object(
    'ok', true,
    'slug', c.slug,
    'published_at', c.published_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_car_on_observation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.publish_car_on_observation(uuid) TO authenticated;

-- D) Extend publish trigger to allow observation-flow bypass
CREATE OR REPLACE FUNCTION public.enforce_car_publish_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  img_count integer;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.published_at IS NOT NULL OR NEW.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.source = 'spotting'::public.car_source THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.publish_on_observation', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF NEW.brand IS NULL OR btrim(NEW.brand::text) = '' THEN
    RAISE EXCEPTION 'Merke må være satt før publisering';
  END IF;

  IF NEW.model IS NULL OR btrim(NEW.model::text) = '' THEN
    RAISE EXCEPTION 'Modell må være satt før publisering';
  END IF;

  SELECT count(*)::integer INTO img_count FROM public.car_images WHERE car_id = NEW.id;
  IF img_count < 1 THEN
    RAISE EXCEPTION 'Minst ett bilde kreves for publisering';
  END IF;

  RETURN NEW;
END;
$function$;