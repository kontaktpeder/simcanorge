
-- Forespørsler om å knytte en bil til en klubbside
CREATE TABLE public.page_car_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (car_id, page_id)
);

CREATE INDEX idx_page_car_link_requests_page_status
  ON public.page_car_link_requests(page_id, status)
  WHERE status = 'pending';

CREATE INDEX idx_page_car_link_requests_car
  ON public.page_car_link_requests(car_id);

ALTER TABLE public.page_car_link_requests ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_page_car_link_request_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_page_car_link_request_status
  BEFORE INSERT OR UPDATE ON public.page_car_link_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_page_car_link_request_status();

-- RLS: Plattformadmin
CREATE POLICY "page_car_link_requests_admin_all"
  ON public.page_car_link_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS: Klubbeier/admin kan lese forespørsler for sine sider (nested subqueries)
CREATE POLICY "page_car_link_requests_owner_select"
  ON public.page_car_link_requests FOR SELECT TO authenticated
  USING (
    page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      WHERE pm.person_profile_id IN (
        SELECT pp.id FROM public.person_profiles pp
        WHERE pp.user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
    )
  );

-- RLS: Klubbeier/admin kan oppdatere forespørsler for sine sider
CREATE POLICY "page_car_link_requests_owner_update"
  ON public.page_car_link_requests FOR UPDATE TO authenticated
  USING (
    page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      WHERE pm.person_profile_id IN (
        SELECT pp.id FROM public.person_profiles pp
        WHERE pp.user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      WHERE pm.person_profile_id IN (
        SELECT pp.id FROM public.person_profiles pp
        WHERE pp.user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
    )
  );

-- RLS: Ingen direkte INSERT fra klient
CREATE POLICY "page_car_link_requests_no_direct_insert"
  ON public.page_car_link_requests FOR INSERT TO authenticated
  WITH CHECK (false);

-- RPC: Opprett forespørsel + varsle klubbeiere
CREATE OR REPLACE FUNCTION public.create_page_car_link_request(
  p_car_id uuid,
  p_page_id uuid,
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payload jsonb;
  _req jsonb;
  _car_title text;
  _club_title text;
  _request_id uuid;
  r record;
BEGIN
  -- Hent innsendingsdata
  SELECT submission_payload, title INTO _payload, _car_title
  FROM cars WHERE id = p_car_id;

  IF _payload IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen innsendingsdata');
  END IF;

  _req := _payload->'club_join_request';
  IF _req IS NULL OR (_req->>'requested')::boolean IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen klubbforespørsel i innsendingen');
  END IF;

  IF (_req->>'page_id')::uuid IS DISTINCT FROM p_page_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Forespørsel matcher ikke valgt klubb');
  END IF;

  -- Opprett/oppdater forespørsel
  INSERT INTO page_car_link_requests (car_id, page_id, message, status)
  VALUES (p_car_id, p_page_id, NULLIF(trim(COALESCE(p_message, '')), ''), 'pending')
  ON CONFLICT (car_id, page_id) DO UPDATE
    SET message = COALESCE(EXCLUDED.message, page_car_link_requests.message),
        status = 'pending',
        resolved_at = NULL,
        resolved_by = NULL
  RETURNING id INTO _request_id;

  -- Hent klubbnavn
  SELECT title INTO _club_title FROM pages WHERE id = p_page_id;

  -- Varsle klubbeiere/adminer
  FOR r IN
    SELECT DISTINCT pp.user_id
    FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = p_page_id
      AND pm.role IN ('owner', 'admin')
  LOOP
    INSERT INTO notifications (user_id, type, title, body, car_id, link, is_read)
    VALUES (
      r.user_id,
      'page_car_link_request',
      'Ny forespørsel om klubbtilknytning',
      format('Noen ønsker å knytte bilen «%s» til klubben «%s».', 
        coalesce(_car_title, 'Uten tittel'), 
        coalesce(_club_title, 'Klubb')),
      p_car_id,
      format('/dashboard/sider/%s', p_page_id),
      false
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'request_id', _request_id);
END;
$$;

-- RPC: Godkjenn forespørsel
CREATE OR REPLACE FUNCTION public.approve_page_car_link_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _car_id uuid;
  _page_id uuid;
BEGIN
  SELECT car_id, page_id INTO _car_id, _page_id
  FROM page_car_link_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF _car_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Forespørsel ikke funnet eller allerede behandlet');
  END IF;

  -- Sjekk tilgang: klubbeier/admin eller plattformadmin
  IF NOT EXISTS (
    SELECT 1 FROM page_memberships pm
    WHERE pm.page_id = _page_id
      AND pm.person_profile_id IN (
        SELECT pp.id FROM person_profiles pp WHERE pp.user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
  ) AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen tilgang');
  END IF;

  -- Knytt bilen til siden
  INSERT INTO page_cars (page_id, car_id) VALUES (_page_id, _car_id)
  ON CONFLICT (page_id, car_id) DO NOTHING;

  -- Oppdater status
  UPDATE page_car_link_requests
  SET status = 'approved', resolved_at = now(), resolved_by = auth.uid()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Avslå forespørsel
CREATE OR REPLACE FUNCTION public.reject_page_car_link_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _page_id uuid;
BEGIN
  SELECT page_id INTO _page_id
  FROM page_car_link_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF _page_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Forespørsel ikke funnet eller allerede behandlet');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM page_memberships pm
    WHERE pm.page_id = _page_id
      AND pm.person_profile_id IN (
        SELECT pp.id FROM person_profiles pp WHERE pp.user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
  ) AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen tilgang');
  END IF;

  UPDATE page_car_link_requests
  SET status = 'rejected', resolved_at = now(), resolved_by = auth.uid()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
