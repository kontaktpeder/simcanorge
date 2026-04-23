-- 1) Table
CREATE TABLE public.car_relationship_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  relationship_type public.car_relationship_type NOT NULL,
  note text,
  relationship_start_year integer,
  relationship_end_year integer,
  wants_stewardship boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_note text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT car_relationship_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE INDEX idx_car_relationship_requests_car ON public.car_relationship_requests(car_id);
CREATE INDEX idx_car_relationship_requests_requester ON public.car_relationship_requests(requester_id);
CREATE INDEX idx_car_relationship_requests_status ON public.car_relationship_requests(status);

-- Idempotency: only one pending request per (car, requester, relationship_type)
CREATE UNIQUE INDEX uniq_car_relationship_requests_pending
  ON public.car_relationship_requests(car_id, requester_id, relationship_type)
  WHERE status = 'pending';

-- updated_at trigger
CREATE TRIGGER trg_car_relationship_requests_updated_at
BEFORE UPDATE ON public.car_relationship_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RLS
ALTER TABLE public.car_relationship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester can view own requests"
  ON public.car_relationship_requests
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Admins can view all requests"
  ON public.car_relationship_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Car owners can view requests for their cars"
  ON public.car_relationship_requests
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.car_owners co
    WHERE co.car_id = car_relationship_requests.car_id
      AND co.user_id = auth.uid()
      AND co.role = 'owner'
  ));

CREATE POLICY "Authenticated users can create own requests"
  ON public.car_relationship_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "Requester can cancel own pending request"
  ON public.car_relationship_requests
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status IN ('pending', 'cancelled'));

CREATE POLICY "Admins can update requests"
  ON public.car_relationship_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Notify on insert: car owner (if any) else all admins
CREATE OR REPLACE FUNCTION public.notify_car_relationship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _car_title text;
  _has_owner boolean := false;
  r record;
BEGIN
  SELECT title INTO _car_title FROM public.cars WHERE id = NEW.car_id;

  -- Notify car owners first
  FOR r IN
    SELECT user_id FROM public.car_owners
    WHERE car_id = NEW.car_id AND role = 'owner' AND user_id <> NEW.requester_id
  LOOP
    _has_owner := true;
    INSERT INTO public.notifications (user_id, type, title, body, car_id, link, is_read)
    VALUES (
      r.user_id,
      'car_relationship_request',
      'Ny relasjonsforespørsel',
      'Noen ønsker å knyttes til "' || COALESCE(_car_title, 'bilen din') || '". Se forespørselen.',
      NEW.car_id,
      '/dashboard/bil/' || NEW.car_id::text,
      false
    );
  END LOOP;

  -- Fallback: notify admins
  IF NOT _has_owner THEN
    FOR r IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, car_id, link, is_read)
      VALUES (
        r.user_id,
        'car_relationship_request',
        'Ny relasjonsforespørsel',
        'Noen ønsker å knyttes til "' || COALESCE(_car_title, 'en bil') || '". Vurder forespørselen.',
        NEW.car_id,
        '/admin/relasjoner',
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_car_relationship_request
AFTER INSERT ON public.car_relationship_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_car_relationship_request();

-- 4) Approve function (admin or current car owner)
CREATE OR REPLACE FUNCTION public.approve_car_relationship_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Insert viewer-level relationship; never grant edit rights in v1
  INSERT INTO public.car_owners (
    car_id, user_id, email, role,
    relationship_type, relationship_note,
    relationship_start_year, relationship_end_year,
    relationship_is_public, relationship_is_verified
  ) VALUES (
    _req.car_id, _req.requester_id, COALESCE(_email, ''), 'viewer',
    _req.relationship_type, _req.note,
    _req.relationship_start_year, _req.relationship_end_year,
    true, true
  )
  ON CONFLICT (car_id, user_id) DO UPDATE
    SET relationship_type = EXCLUDED.relationship_type,
        relationship_note = COALESCE(EXCLUDED.relationship_note, public.car_owners.relationship_note),
        relationship_start_year = COALESCE(EXCLUDED.relationship_start_year, public.car_owners.relationship_start_year),
        relationship_end_year = COALESCE(EXCLUDED.relationship_end_year, public.car_owners.relationship_end_year),
        relationship_is_verified = true;

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
$$;

-- Ensure unique car_owners(car_id, user_id) for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'car_owners_car_user_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.car_owners
        ADD CONSTRAINT car_owners_car_user_unique UNIQUE (car_id, user_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- 5) Reject function
CREATE OR REPLACE FUNCTION public.reject_car_relationship_request(p_request_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _req record;
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

  UPDATE public.car_relationship_requests
  SET status = 'rejected',
      reviewer_id = auth.uid(),
      reviewer_note = p_note,
      reviewed_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, type, title, body, car_id, link, is_read)
  VALUES (
    _req.requester_id,
    'car_relationship_rejected',
    'Relasjon ikke godkjent',
    COALESCE('Forespørselen ble ikke godkjent. ' || p_note, 'Forespørselen ble ikke godkjent.'),
    _req.car_id,
    '/',
    false
  );

  RETURN jsonb_build_object('success', true);
END;
$$;