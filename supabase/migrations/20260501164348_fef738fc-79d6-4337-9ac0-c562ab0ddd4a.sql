-- 1) Metadata på car_relationship_requests
ALTER TABLE public.car_relationship_requests
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_event_id uuid NULL REFERENCES public.car_events(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'car_relationship_requests_source_chk'
  ) THEN
    ALTER TABLE public.car_relationship_requests
      ADD CONSTRAINT car_relationship_requests_source_chk
      CHECK (source IN ('manual', 'regnr_gate', 'spotting', 'activity_moment'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_relationship_requests_source
  ON public.car_relationship_requests(source);

-- 2) Strammere idempotency: én pending per (car, requester)
DROP INDEX IF EXISTS public.uniq_car_relationship_requests_pending;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_car_relationship_requests_pending
  ON public.car_relationship_requests(car_id, requester_id)
  WHERE status = 'pending';

-- 3) Trygg creator-RPC
CREATE OR REPLACE FUNCTION public.create_car_relationship_request_safe(
  p_car_id uuid,
  p_relationship_type public.car_relationship_type DEFAULT 'contributor',
  p_note text DEFAULT NULL,
  p_start_year integer DEFAULT NULL,
  p_end_year integer DEFAULT NULL,
  p_wants_stewardship boolean DEFAULT false,
  p_source text DEFAULT 'manual',
  p_source_event_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing_owner record;
  _pending record;
  _inserted record;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_authenticated');
  END IF;

  SELECT id, role
  INTO _existing_owner
  FROM public.car_owners
  WHERE car_id = p_car_id AND user_id = _uid
  LIMIT 1;

  IF _existing_owner.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'already_linked',
      'role', _existing_owner.role
    );
  END IF;

  SELECT id
  INTO _pending
  FROM public.car_relationship_requests
  WHERE car_id = p_car_id
    AND requester_id = _uid
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF _pending.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'already_pending',
      'request_id', _pending.id
    );
  END IF;

  INSERT INTO public.car_relationship_requests(
    car_id,
    requester_id,
    relationship_type,
    note,
    relationship_start_year,
    relationship_end_year,
    wants_stewardship,
    status,
    source,
    source_event_id
  )
  VALUES (
    p_car_id,
    _uid,
    p_relationship_type,
    NULLIF(btrim(p_note), ''),
    p_start_year,
    p_end_year,
    COALESCE(p_wants_stewardship, false),
    'pending',
    p_source,
    p_source_event_id
  )
  RETURNING *
  INTO _inserted;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'created',
    'request_id', _inserted.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_car_relationship_request_safe(
  uuid, public.car_relationship_type, text, integer, integer, boolean, text, uuid
) FROM public;
GRANT EXECUTE ON FUNCTION public.create_car_relationship_request_safe(
  uuid, public.car_relationship_type, text, integer, integer, boolean, text, uuid
) TO authenticated;