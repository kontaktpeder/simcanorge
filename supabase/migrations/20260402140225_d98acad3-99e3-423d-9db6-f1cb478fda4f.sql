
CREATE TABLE public.events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_profile_id    UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  owner_page_id       UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  event_type          TEXT NOT NULL DEFAULT 'meet'
                      CHECK (event_type IN (
                        'meet','show','market','drive',
                        'club_night','exhibition','open_day','other'
                      )),
  short_description   TEXT,
  description         TEXT,
  program             TEXT,
  practical_info      TEXT,
  location            TEXT NOT NULL,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ,
  registration_url    TEXT,
  max_attendees       INTEGER,
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','published','cancelled','archived')),
  CONSTRAINT events_has_owner
    CHECK (owner_profile_id IS NOT NULL OR owner_page_id IS NOT NULL)
);

CREATE INDEX events_slug_idx           ON public.events (slug);
CREATE INDEX events_status_idx         ON public.events (status);
CREATE INDEX events_starts_at_idx      ON public.events (starts_at);
CREATE INDEX events_owner_profile_idx  ON public.events (owner_profile_id);
CREATE INDEX events_owner_page_idx     ON public.events (owner_page_id);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.events
  ADD CONSTRAINT events_slug_format
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE POLICY "events_owner_read"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
    OR owner_page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
      WHERE pp.user_id = auth.uid()
        AND pm.role IN ('owner','admin','editor')
    )
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
    OR owner_page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
      WHERE pp.user_id = auth.uid()
        AND pm.role IN ('owner','admin','editor')
    )
  );

CREATE POLICY "events_owner_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
    OR owner_page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
      WHERE pp.user_id = auth.uid()
        AND pm.role IN ('owner','admin','editor')
    )
  );

CREATE POLICY "events_owner_delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_admin_all"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
