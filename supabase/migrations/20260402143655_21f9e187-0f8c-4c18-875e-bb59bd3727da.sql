
-- Fix page_memberships RLS
DROP POLICY IF EXISTS "page_memberships_member_read" ON public.page_memberships;
DROP POLICY IF EXISTS "page_memberships_owner_insert" ON public.page_memberships;
DROP POLICY IF EXISTS "page_memberships_owner_update" ON public.page_memberships;

CREATE POLICY "page_memberships_member_read"
  ON public.page_memberships FOR SELECT
  TO authenticated
  USING (
    person_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
    OR
    page_id IN (
      SELECT page_id FROM public.page_memberships
      WHERE person_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "page_memberships_owner_insert"
  ON public.page_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      WHERE pm.person_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
    )
    OR
    person_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "page_memberships_owner_update"
  ON public.page_memberships FOR UPDATE
  TO authenticated
  USING (
    page_id IN (
      SELECT pm.page_id FROM public.page_memberships pm
      WHERE pm.person_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      )
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Fix events RLS
DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_owner_read" ON public.events;
DROP POLICY IF EXISTS "events_owner_person_read" ON public.events;
DROP POLICY IF EXISTS "events_owner_page_read" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_owner_update" ON public.events;
DROP POLICY IF EXISTS "events_owner_delete" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;

CREATE POLICY "events_public_read"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE POLICY "events_owner_person_read"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_owner_page_read"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    owner_page_id IN (
      SELECT page_id FROM public.page_memberships
      WHERE person_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      )
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_owner_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    owner_profile_id IN (
      SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
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
