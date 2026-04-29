-- ============================================================
-- 1) PERSON_PROFILES: hide contact_email / contact_phone publicly
-- ============================================================

-- Drop overly permissive public read that exposed all columns
DROP POLICY IF EXISTS person_profiles_public_read ON public.person_profiles;

-- Safe public view exposing only non-PII fields
CREATE OR REPLACE VIEW public.public_person_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  display_name,
  slug,
  bio,
  avatar_url,
  cover_url,
  location,
  favorite_brands,
  is_public,
  can_create_pages,
  visible_public,
  approved_at,
  created_at,
  updated_at
FROM public.person_profiles
WHERE is_public = true;

-- Re-allow public read but only via the view; underlying table still guarded.
-- We need a row-level read policy so the view (security_invoker) can read rows.
-- Restrict to is_public = true; columns are limited by the view.
CREATE POLICY person_profiles_public_read_safe
  ON public.person_profiles
  FOR SELECT
  USING (is_public = true);

-- NOTE: To prevent column-level PII leak through direct table queries,
-- revoke direct column SELECT on contact_email / contact_phone from anon/auth.
REVOKE SELECT (contact_email, contact_phone) ON public.person_profiles FROM anon, authenticated;

-- Ensure remaining safe columns stay readable for anon/authenticated
GRANT SELECT (
  id, user_id, display_name, slug, bio, avatar_url, cover_url, location,
  favorite_brands, is_public, can_create_pages, visible_public,
  approved_at, requested_approval_at, created_at, updated_at
) ON public.person_profiles TO anon, authenticated;

GRANT SELECT ON public.public_person_profiles TO anon, authenticated;


-- ============================================================
-- 2) OWNERS: hide contact_email / contact_phone publicly
-- ============================================================

DROP POLICY IF EXISTS "Public can view visible approved owner profiles" ON public.owners;
DROP POLICY IF EXISTS "Public can view visible owner profiles" ON public.owners;

-- Safe view
CREATE OR REPLACE VIEW public.public_owner_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  display_name,
  bio,
  location,
  favorite_brands,
  avatar_url,
  visible_public,
  approved_at,
  created_at
FROM public.owners
WHERE visible_public = true
  AND approved_at IS NOT NULL;

-- Allow row-level read for the public-safe rows; limit columns at grant level.
CREATE POLICY owners_public_read_safe
  ON public.owners
  FOR SELECT
  USING (visible_public = true AND approved_at IS NOT NULL);

REVOKE SELECT (contact_email, contact_phone) ON public.owners FROM anon, authenticated;

GRANT SELECT (
  id, user_id, display_name, slug, bio, location, favorite_brands,
  avatar_url, visible_public, approved_at, requested_approval_at,
  created_at, updated_at, username
) ON public.owners TO anon, authenticated;

GRANT SELECT ON public.public_owner_profiles TO anon, authenticated;


-- ============================================================
-- 3) INQUIRY RATE LIMITS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inquiry_rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_rate_limits_window_start
  ON public.inquiry_rate_limits(window_start);

ALTER TABLE public.inquiry_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct client access; only service role / definer functions.
DROP POLICY IF EXISTS inquiry_rate_limits_admin_read ON public.inquiry_rate_limits;
CREATE POLICY inquiry_rate_limits_admin_read
  ON public.inquiry_rate_limits
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Atomic check-and-increment
CREATE OR REPLACE FUNCTION public.check_inquiry_rate_limit(
  p_key text,
  p_max integer DEFAULT 5,
  p_window_minutes integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.inquiry_rate_limits;
  _now timestamptz := now();
  _window interval := make_interval(mins => p_window_minutes);
BEGIN
  INSERT INTO public.inquiry_rate_limits (key, window_start, count, updated_at)
  VALUES (p_key, _now, 1, _now)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                  WHEN public.inquiry_rate_limits.window_start < _now - _window THEN 1
                  ELSE public.inquiry_rate_limits.count + 1
                END,
        window_start = CASE
                         WHEN public.inquiry_rate_limits.window_start < _now - _window THEN _now
                         ELSE public.inquiry_rate_limits.window_start
                       END,
        updated_at = _now
  RETURNING * INTO _row;

  IF _row.count > p_max THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'count', _row.count,
      'limit', p_max,
      'retry_after_seconds', GREATEST(
        0,
        EXTRACT(EPOCH FROM ((_row.window_start + _window) - _now))::int
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'count', _row.count,
    'limit', p_max
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_inquiry_rate_limit(text, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.check_inquiry_rate_limit(text, integer, integer) TO service_role;

-- Cleanup helper
CREATE OR REPLACE FUNCTION public.cleanup_old_inquiry_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.inquiry_rate_limits
  WHERE window_start < now() - interval '2 days';
END;
$$;