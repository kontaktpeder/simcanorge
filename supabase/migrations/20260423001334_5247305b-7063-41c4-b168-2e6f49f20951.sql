-- Fix semantic: approved relationship != objectively verified
-- Admin/owner approval means the relationship is accepted in the product,
-- not that it has been independently verified.
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

  -- Get requester email from auth.users
  SELECT email INTO _email FROM auth.users WHERE id = _req.requester_id;

  -- IMPORTANT: viewer-rows in car_owners do NOT grant edit access to the car.
  -- All edit policies on cars/car_images/car_events check role = 'owner' explicitly.
  -- A viewer row only represents an accepted (but not independently verified) relationship.
  -- Never escalate to 'owner' here in v1.
  INSERT INTO public.car_owners (
    car_id, user_id, email, role,
    relationship_type, relationship_note,
    relationship_start_year, relationship_end_year,
    relationship_is_public, relationship_is_verified
  ) VALUES (
    _req.car_id, _req.requester_id, COALESCE(_email, ''), 'viewer',
    _req.relationship_type, _req.note,
    _req.relationship_start_year, _req.relationship_end_year,
    true, false  -- approved != verified; verification is a future, separate step
  )
  ON CONFLICT (car_id, user_id) DO UPDATE
    SET relationship_type = EXCLUDED.relationship_type,
        relationship_note = COALESCE(EXCLUDED.relationship_note, public.car_owners.relationship_note),
        relationship_start_year = COALESCE(EXCLUDED.relationship_start_year, public.car_owners.relationship_start_year),
        relationship_end_year = COALESCE(EXCLUDED.relationship_end_year, public.car_owners.relationship_end_year);
        -- Do NOT touch relationship_is_verified on conflict — preserve any prior verification state.

  UPDATE public.car_relationship_requests
  SET status = 'approved',
      reviewer_id = auth.uid(),
      reviewed_at = now()
  WHERE id = p_request_id;

  -- Notify requester
  INSERT INTO public.notifications (user_id, type, title, body, car_id, link, is_read)
  VALUES (
    _req.requester_id,
    'car_relationship_approved',
    'Relasjon godkjent',
    'Din forespørsel om tilknytning til bilen er godkjent.',
    _req.car_id,
    '/dashboard/mine-biler',
    false
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Document semantic overload of car_owners
COMMENT ON TABLE public.car_owners IS
  'Stores both hard ownership (role=''owner'', full edit access via RLS) and soft historical relationships (role=''viewer'', read-only, no edit rights). All edit RLS policies must check role=''owner'' explicitly. Never treat mere existence in this table as edit authority.';

COMMENT ON COLUMN public.car_owners.role IS
  'Either ''owner'' (full edit access, granted by claim/invitation) or ''viewer'' (read-only relationship from approved car_relationship_requests). Edit policies must filter on role=''owner''.';

COMMENT ON COLUMN public.car_owners.relationship_is_verified IS
  'TRUE only when an independent verification step (e.g. document/photo proof) has been completed. ''Approved'' relationship requests do NOT set this to true — approval merely accepts the claim into the product.';