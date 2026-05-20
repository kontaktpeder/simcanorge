CREATE OR REPLACE FUNCTION public.feed_post_from_car_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
  v_post_type text;
  v_snapshot_title text;
  v_snapshot_image text;
  v_body text;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
  IF NEW.visibility IS DISTINCT FROM 'public' THEN RETURN NEW; END IF;
  IF NEW.car_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.category::text = 'bruk' AND NEW.event_type::text = 'moment' THEN
    v_post_type := 'car_moment';
  ELSIF NEW.category::text = 'gjenoppdagelse' AND NEW.event_type::text = 'dokumentert' THEN
    v_post_type := 'car_spotting';
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;

  SELECT pp.id INTO v_profile_id
  FROM public.person_profiles pp
  WHERE pp.user_id = NEW.created_by
  LIMIT 1;

  IF v_profile_id IS NULL THEN RETURN NEW; END IF;

  SELECT cei.image_url INTO v_snapshot_image
  FROM public.car_event_images cei
  WHERE cei.car_event_id = NEW.id
  ORDER BY cei.sort_order ASC NULLS LAST, cei.created_at ASC
  LIMIT 1;

  v_snapshot_title := COALESCE(NULLIF(btrim(NEW.title), ''), 'Spotting');
  v_body := NULLIF(btrim(NEW.description), '');
  v_snapshot_image := COALESCE(NULLIF(btrim(NEW.data->>'image_url'), ''), NULLIF(btrim(v_snapshot_image), ''));

  INSERT INTO public.feed_posts (
    author_profile_id, post_type, body, car_id, car_event_id,
    snapshot_title, snapshot_image_url, snapshot_entity_type, is_visible
  )
  VALUES (
    v_profile_id, v_post_type, v_body, NEW.car_id, NEW.id,
    v_snapshot_title, v_snapshot_image, 'car', true
  )
  ON CONFLICT (car_event_id) WHERE (car_event_id IS NOT NULL) DO UPDATE
  SET
    car_id = EXCLUDED.car_id,
    snapshot_title = COALESCE(public.feed_posts.snapshot_title, EXCLUDED.snapshot_title),
    snapshot_image_url = COALESCE(public.feed_posts.snapshot_image_url, EXCLUDED.snapshot_image_url),
    snapshot_entity_type = 'car';

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.feed_post_snapshot_from_event_image()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url text;
  v_car_id uuid;
BEGIN
  v_url := NULLIF(btrim(NEW.image_url), '');
  IF v_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ce.car_id INTO v_car_id
  FROM public.car_events ce
  WHERE ce.id = NEW.car_event_id;

  UPDATE public.feed_posts fp
  SET
    snapshot_image_url = COALESCE(NULLIF(btrim(fp.snapshot_image_url), ''), v_url),
    car_id = COALESCE(fp.car_id, v_car_id),
    snapshot_entity_type = COALESCE(fp.snapshot_entity_type, 'car')
  WHERE fp.car_event_id = NEW.car_event_id;

  RETURN NEW;
END;
$function$;

WITH ranked AS (
  SELECT
    fp.id AS feed_post_id,
    ce.id AS car_event_id,
    ce.car_id,
    ROW_NUMBER() OVER (
      PARTITION BY fp.id
      ORDER BY abs(extract(epoch from (fp.created_at - ce.created_at))) ASC
    ) AS rn
  FROM public.feed_posts fp
  JOIN public.person_profiles pp ON pp.id = fp.author_profile_id
  JOIN public.car_events ce ON ce.created_by = pp.user_id
  WHERE fp.post_type = 'car_spotting'
    AND fp.car_id IS NULL
    AND fp.car_event_id IS NULL
    AND ce.visibility = 'public'
    AND ce.category::text = 'gjenoppdagelse'
    AND ce.event_type::text = 'dokumentert'
    AND ce.car_id IS NOT NULL
    AND ce.created_at BETWEEN fp.created_at - interval '30 minutes' AND fp.created_at + interval '30 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.feed_posts existing
      WHERE existing.car_event_id = ce.id
        AND existing.id <> fp.id
    )
), first_image AS (
  SELECT DISTINCT ON (cei.car_event_id)
    cei.car_event_id,
    cei.image_url
  FROM public.car_event_images cei
  ORDER BY cei.car_event_id, cei.sort_order ASC NULLS LAST, cei.created_at ASC
)
UPDATE public.feed_posts fp
SET
  car_id = ranked.car_id,
  car_event_id = ranked.car_event_id,
  snapshot_image_url = COALESCE(first_image.image_url, fp.snapshot_image_url),
  snapshot_entity_type = 'car'
FROM ranked
LEFT JOIN first_image ON first_image.car_event_id = ranked.car_event_id
WHERE fp.id = ranked.feed_post_id
  AND ranked.rn = 1;

WITH event_rows AS (
  SELECT
    ce.id AS car_event_id,
    ce.car_id,
    ce.title,
    ce.description,
    pp.id AS author_profile_id,
    ce.created_at,
    CASE
      WHEN ce.category::text = 'bruk' AND ce.event_type::text = 'moment' THEN 'car_moment'
      WHEN ce.category::text = 'gjenoppdagelse' AND ce.event_type::text = 'dokumentert' THEN 'car_spotting'
      ELSE NULL
    END AS post_type
  FROM public.car_events ce
  JOIN public.person_profiles pp ON pp.user_id = ce.created_by
  WHERE ce.visibility = 'public'
    AND ce.car_id IS NOT NULL
    AND ce.created_by IS NOT NULL
    AND (
      (ce.category::text = 'bruk' AND ce.event_type::text = 'moment')
      OR (ce.category::text = 'gjenoppdagelse' AND ce.event_type::text = 'dokumentert')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.feed_posts fp
      WHERE fp.car_event_id = ce.id
    )
), first_image AS (
  SELECT DISTINCT ON (cei.car_event_id)
    cei.car_event_id,
    cei.image_url
  FROM public.car_event_images cei
  ORDER BY cei.car_event_id, cei.sort_order ASC NULLS LAST, cei.created_at ASC
)
INSERT INTO public.feed_posts (
  author_profile_id, post_type, body, car_id, car_event_id,
  snapshot_title, snapshot_image_url, snapshot_entity_type, is_visible, created_at
)
SELECT
  er.author_profile_id,
  er.post_type,
  NULLIF(btrim(er.description), ''),
  er.car_id,
  er.car_event_id,
  COALESCE(NULLIF(btrim(er.title), ''), 'Spotting'),
  fi.image_url,
  'car',
  true,
  er.created_at
FROM event_rows er
LEFT JOIN first_image fi ON fi.car_event_id = er.car_event_id
WHERE er.post_type IS NOT NULL
ON CONFLICT (car_event_id) WHERE (car_event_id IS NOT NULL) DO NOTHING;