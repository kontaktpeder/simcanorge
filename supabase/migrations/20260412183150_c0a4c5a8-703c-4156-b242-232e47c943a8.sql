
-- Fix RLS: use JWT email instead of auth.users table
DROP POLICY IF EXISTS "Submitters can claim their cars" ON public.cars;
DROP POLICY IF EXISTS "Users can view cars they submitted by email" ON public.cars;

CREATE POLICY "Submitters can claim their cars"
ON public.cars
FOR UPDATE
TO authenticated
USING (
  created_by_user_id IS NULL
  AND status = 'submitted'
  AND submitted_by_email IS NOT NULL
  AND lower(trim(submitted_by_email)) = lower(trim(auth.jwt() ->> 'email'))
)
WITH CHECK (
  created_by_user_id = auth.uid()
);

CREATE POLICY "Users can view cars they submitted by email"
ON public.cars
FOR SELECT
TO authenticated
USING (
  submitted_by_email IS NOT NULL
  AND lower(trim(submitted_by_email)) = lower(trim(auth.jwt() ->> 'email'))
);

-- Atomic claim function: updates car + inserts car_owners in one call
CREATE OR REPLACE FUNCTION public.claim_car_after_email_verify(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  em text := lower(trim(auth.jwt() ->> 'email'));
BEGIN
  IF uid IS NULL OR em IS NULL OR em = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Check if already claimed by this user
  IF EXISTS (
    SELECT 1 FROM public.cars
    WHERE id = p_car_id AND created_by_user_id = uid
  ) THEN
    -- Already claimed, ensure car_owners row exists
    INSERT INTO public.car_owners (car_id, user_id, email, role)
    VALUES (p_car_id, uid, em, 'owner')
    ON CONFLICT (car_id, user_id) DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'already_claimed', true);
  END IF;

  -- Attempt to claim
  UPDATE public.cars
  SET created_by_user_id = uid
  WHERE id = p_car_id
    AND created_by_user_id IS NULL
    AND status = 'submitted'
    AND submitted_by_email IS NOT NULL
    AND lower(trim(submitted_by_email)) = em;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_claimable');
  END IF;

  -- Insert car_owners row for dashboard access
  INSERT INTO public.car_owners (car_id, user_id, email, role)
  VALUES (p_car_id, uid, em, 'owner')
  ON CONFLICT (car_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_car_after_email_verify(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_car_after_email_verify(uuid) TO authenticated;
