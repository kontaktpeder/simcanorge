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

  v_snapshot_title := COALESCE(NULLIF(btrim(NEW.title), ''), 'Øyeblikk');
  v_body := NULLIF(btrim(NEW.description), '');
  v_snapshot_image := NULLIF(btrim(NEW.data->>'image_url'), '');

  -- Use partial-index inference by including the WHERE predicate
  INSERT INTO public.feed_posts (
    author_profile_id, post_type, body, car_id, car_event_id,
    snapshot_title, snapshot_image_url, snapshot_entity_type, is_visible
  )
  VALUES (
    v_profile_id, v_post_type, v_body, NEW.car_id, NEW.id,
    v_snapshot_title, v_snapshot_image, 'car', true
  )
  ON CONFLICT (car_event_id) WHERE (car_event_id IS NOT NULL) DO NOTHING;

  RETURN NEW;
END;
$function$;