
CREATE TABLE public.event_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'going'
              CHECK (status IN ('going')),
  UNIQUE (event_id, profile_id)
);

CREATE INDEX event_attendees_event_id_idx   ON public.event_attendees (event_id);
CREATE INDEX event_attendees_profile_id_idx ON public.event_attendees (profile_id);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_attendees_own_read"
  ON public.event_attendees FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "event_attendees_own_insert"
  ON public.event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "event_attendees_own_delete"
  ON public.event_attendees FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "event_attendees_admin_all"
  ON public.event_attendees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.get_event_attendee_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.event_attendees
  WHERE event_id = p_event_id;
$$;
