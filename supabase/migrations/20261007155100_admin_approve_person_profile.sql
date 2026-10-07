-- Admin can read and update every person profile (approval + visibility).
-- Approval itself goes through admin_approve_person_profile and does not
-- send email or in-app notifications.

DROP POLICY IF EXISTS "Admins can read all person profiles" ON public.person_profiles;
CREATE POLICY "Admins can read all person profiles"
ON public.person_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update all person profiles" ON public.person_profiles;
CREATE POLICY "Admins can update all person profiles"
ON public.person_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.admin_approve_person_profile(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _approved_at timestamptz := now();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Ikke tilgang';
  END IF;

  UPDATE public.person_profiles
  SET approved_at = _approved_at
  WHERE id = _profile_id
  RETURNING user_id INTO _user_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Profil ikke funnet';
  END IF;

  UPDATE public.owners
  SET approved_at = _approved_at
  WHERE user_id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_person_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_person_profile(uuid) TO authenticated;
