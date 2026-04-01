
CREATE TABLE public.access_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  message     text,
  status      text NOT NULL DEFAULT 'pending',
  invite_sent_at timestamptz,
  admin_note  text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_access_request_status()
RETURNS trigger
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

CREATE TRIGGER trg_validate_access_request_status
BEFORE INSERT OR UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_access_request_status();

-- Anyone (including anonymous) can submit
CREATE POLICY "Alle kan sende tilgangssøknad"
  ON public.access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admin can read
CREATE POLICY "Admin kan lese tilgangssøknader"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin can update
CREATE POLICY "Admin kan oppdatere tilgangssøknader"
  ON public.access_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
