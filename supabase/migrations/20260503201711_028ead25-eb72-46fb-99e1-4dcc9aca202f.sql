-- feed_posts: link to originating car_event (idempotent fan-out)
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS car_event_id uuid NULL
  REFERENCES public.car_events(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feed_posts_car_event_id_unique
  ON public.feed_posts (car_event_id)
  WHERE car_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_car_event_id
  ON public.feed_posts (car_event_id)
  WHERE car_event_id IS NOT NULL;

-- Fan-out trigger function
CREATE OR REPLACE FUNCTION public.feed_post_from_car_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_post_type text;
  v_snapshot_title text;
  v_snapshot_image text;
  v_body text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;
  IF NEW.visibility IS DISTINCT FROM 'public' THEN
    RETURN NEW;
  END IF;
  IF NEW.car_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.category::text = 'bruk' AND NEW.event_type::text = 'moment' THEN
    v_post_type := 'car_moment';
  ELSIF NEW.category::text = 'gjenoppdagelse' AND NEW.event_type::text = 'dokumentert' THEN
    v_post_type := 'car_spotting';
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT pp.id INTO v_profile_id
  FROM public.person_profiles pp
  WHERE pp.user_id = NEW.created_by
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_snapshot_title := COALESCE(NULLIF(btrim(NEW.title), ''), 'Øyeblikk');
  v_body := NULLIF(btrim(NEW.description), '');
  v_snapshot_image := NULLIF(btrim(NEW.data->>'image_url'), '');

  INSERT INTO public.feed_posts (
    author_profile_id,
    post_type,
    body,
    car_id,
    car_event_id,
    snapshot_title,
    snapshot_image_url,
    snapshot_entity_type,
    is_visible
  )
  VALUES (
    v_profile_id,
    v_post_type,
    v_body,
    NEW.car_id,
    NEW.id,
    v_snapshot_title,
    v_snapshot_image,
    'car',
    true
  )
  ON CONFLICT (car_event_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.feed_post_from_car_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_feed_post_from_car_event ON public.car_events;
CREATE TRIGGER trg_feed_post_from_car_event
  AFTER INSERT ON public.car_events
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_post_from_car_event();

-- Backfill snapshot_image_url when car_event_images appears (spotting flow)
CREATE OR REPLACE FUNCTION public.feed_post_snapshot_from_event_image()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  v_url := NULLIF(btrim(NEW.image_url), '');
  IF v_url IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.feed_posts fp
  SET snapshot_image_url = v_url
  WHERE fp.car_event_id = NEW.car_event_id
    AND (fp.snapshot_image_url IS NULL OR btrim(fp.snapshot_image_url) = '');

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.feed_post_snapshot_from_event_image() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_feed_post_snapshot_from_event_image ON public.car_event_images;
CREATE TRIGGER trg_feed_post_snapshot_from_event_image
  AFTER INSERT ON public.car_event_images
  FOR EACH ROW
  EXECUTE FUNCTION public.feed_post_snapshot_from_event_image();