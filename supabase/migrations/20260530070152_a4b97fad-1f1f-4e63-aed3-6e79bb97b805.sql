
CREATE OR REPLACE FUNCTION public.claim_car_as_steward(
  p_car_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  em text := lower(trim(auth.jwt() ->> 'email'));
  c record;
  has_steward boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, slug, created_by_user_id
  INTO c
  FROM public.cars
  WHERE id = p_car_id;

  IF c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_id = p_car_id
      AND role IN ('owner', 'admin')
  ) INTO has_steward;

  IF has_steward THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_stewarded');
  END IF;

  -- Set created_by_user_id if currently null
  UPDATE public.cars
  SET created_by_user_id = uid
  WHERE id = p_car_id
    AND created_by_user_id IS NULL;

  -- Insert ownership row
  INSERT INTO public.car_owners (
    car_id, user_id, email, role,
    relationship_type, relationship_note,
    relationship_is_public, relationship_is_verified
  ) VALUES (
    p_car_id, uid, COALESCE(em, ''), 'owner',
    'owner', NULLIF(btrim(p_note), ''),
    true, false
  )
  ON CONFLICT (car_id, user_id) DO UPDATE
    SET role = 'owner',
        relationship_note = COALESCE(EXCLUDED.relationship_note, public.car_owners.relationship_note);

  RETURN jsonb_build_object('ok', true, 'slug', c.slug);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_car_as_steward(uuid, text) TO authenticated;
