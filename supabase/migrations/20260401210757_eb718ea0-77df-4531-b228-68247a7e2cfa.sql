
-- Admin search function with email from auth.users
CREATE OR REPLACE FUNCTION public.admin_search_profiles(search_term TEXT DEFAULT '')
RETURNS TABLE (
  id              UUID,
  display_name    TEXT,
  slug            TEXT,
  is_public       BOOLEAN,
  can_create_pages BOOLEAN,
  created_at      TIMESTAMPTZ,
  email           TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Ikke tilgang';
  END IF;

  RETURN QUERY
  SELECT
    pp.id,
    pp.display_name,
    pp.slug,
    pp.is_public,
    pp.can_create_pages,
    pp.created_at,
    au.email
  FROM public.person_profiles pp
  JOIN auth.users au ON au.id = pp.user_id
  WHERE
    search_term = ''
    OR pp.display_name ILIKE '%' || search_term || '%'
    OR pp.slug ILIKE '%' || search_term || '%'
    OR au.email ILIKE '%' || search_term || '%'
  ORDER BY pp.created_at DESC
  LIMIT 50;
END;
$$;

-- Page access requests table
CREATE TABLE public.page_access_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL UNIQUE REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_page_access_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_page_access_request_status_trigger
BEFORE INSERT OR UPDATE ON public.page_access_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_page_access_request_status();

ALTER TABLE public.page_access_requests ENABLE ROW LEVEL SECURITY;

-- User can read and create their own request
CREATE POLICY "access_requests_own_read"
  ON public.page_access_requests FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT pp.id FROM public.person_profiles pp WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "access_requests_own_insert"
  ON public.page_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT pp.id FROM public.person_profiles pp WHERE pp.user_id = auth.uid()
    )
  );

-- Admin can do everything
CREATE POLICY "access_requests_admin"
  ON public.page_access_requests FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );
