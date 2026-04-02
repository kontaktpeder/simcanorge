
CREATE TABLE public.event_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX event_images_event_id_idx ON public.event_images (event_id);

ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_images_public_read"
  ON public.event_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_images.event_id AND status = 'published'
    )
  );

CREATE POLICY "event_images_owner_read"
  ON public.event_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id
        AND (
          e.owner_profile_id IN (
            SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
          )
          OR e.owner_page_id IN (
            SELECT pm.page_id FROM public.page_memberships pm
            JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
            WHERE pp.user_id = auth.uid()
              AND pm.role IN ('owner','admin','editor')
          )
        )
    )
  );

CREATE POLICY "event_images_owner_insert"
  ON public.event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id
        AND (
          e.owner_profile_id IN (
            SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
          )
          OR e.owner_page_id IN (
            SELECT pm.page_id FROM public.page_memberships pm
            JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
            WHERE pp.user_id = auth.uid()
              AND pm.role IN ('owner','admin','editor')
          )
        )
    )
  );

CREATE POLICY "event_images_owner_update"
  ON public.event_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id
        AND (
          e.owner_profile_id IN (
            SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
          )
          OR e.owner_page_id IN (
            SELECT pm.page_id FROM public.page_memberships pm
            JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
            WHERE pp.user_id = auth.uid()
              AND pm.role IN ('owner','admin','editor')
          )
        )
    )
  );

CREATE POLICY "event_images_owner_delete"
  ON public.event_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id
        AND (
          e.owner_profile_id IN (
            SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
          )
          OR e.owner_page_id IN (
            SELECT pm.page_id FROM public.page_memberships pm
            JOIN public.person_profiles pp ON pp.id = pm.person_profile_id
            WHERE pp.user_id = auth.uid()
              AND pm.role IN ('owner','admin','editor')
          )
        )
    )
  );

CREATE POLICY "event_images_admin_all"
  ON public.event_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
