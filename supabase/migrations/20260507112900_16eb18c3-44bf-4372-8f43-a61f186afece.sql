-- Update approve_car_relationship_request to grant 'owner' when wants_stewardship is true.
-- Stewardship = full edit access (same as invite-link). Otherwise viewer (read-only relationship).
CREATE OR REPLACE FUNCTION public.approve_car_relationship_request(p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _req record;
  _email text;
  _is_admin boolean;
  _is_owner boolean;
  _new_role text;
BEGIN
  SELECT * INTO _req
  FROM public.car_relationship_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF _req IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Forespørsel ikke funnet eller allerede behandlet');
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::public.app_role);
  _is_owner := EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_id = _req.car_id AND user_id = auth.uid() AND role = 'owner'
  );

  IF NOT (_is_admin OR _is_owner) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen tilgang');
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _req.requester_id;

  -- Stewardship requests grant 'owner' (full edit access via RLS), same as invite-link claims.
  -- Non-stewardship requests stay as 'viewer' (historical relationship, no edit).
  -- Edit policies on cars/car_images/car_events keep checking role = 'owner' explicitly.
  _new_role := CASE WHEN _req.wants_stewardship THEN 'owner' ELSE 'viewer' END;

  INSERT INTO public.car_owners (
    car_id, user_id, email, role,
    relationship_type, relationship_note,
    relationship_start_year, relationship_end_year,
    relationship_is_public, relationship_is_verified
  ) VALUES (
    _req.car_id, _req.requester_id, COALESCE(_email, ''), _new_role,
    _req.relationship_type, _req.note,
    _req.relationship_start_year, _req.relationship_end_year,
    true, false
  )
  ON CONFLICT (car_id, user_id) DO UPDATE
    SET relationship_type = EXCLUDED.relationship_type,
        relationship_note = COALESCE(EXCLUDED.relationship_note, public.car_owners.relationship_note),
        relationship_start_year = COALESCE(EXCLUDED.relationship_start_year, public.car_owners.relationship_start_year),
        relationship_end_year = COALESCE(EXCLUDED.relationship_end_year, public.car_owners.relationship_end_year),
        -- Only escalate role upward (viewer -> owner), never downgrade owner -> viewer.
        role = CASE
          WHEN public.car_owners.role = 'owner' THEN 'owner'
          ELSE EXCLUDED.role
        END;

  UPDATE public.car_relationship_requests
  SET status = 'approved',
      reviewer_id = auth.uid(),
      reviewed_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, type, title, body, car_id, link, is_read)
  VALUES (
    _req.requester_id,
    'car_relationship_approved',
    CASE WHEN _req.wants_stewardship THEN 'Du har fått redigeringstilgang' ELSE 'Relasjon godkjent' END,
    CASE WHEN _req.wants_stewardship
      THEN 'Forespørselen din er godkjent. Du kan nå redigere bilen.'
      ELSE 'Din forespørsel om tilknytning til bilen er godkjent.'
    END,
    _req.car_id,
    CASE WHEN _req.wants_stewardship THEN '/dashboard/mine-biler' ELSE '/dashboard/mine-biler' END,
    false
  );

  RETURN jsonb_build_object('success', true, 'role', _new_role);
END;
$function$;