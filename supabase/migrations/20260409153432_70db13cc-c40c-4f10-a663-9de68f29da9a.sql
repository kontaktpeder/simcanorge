
-- Drop eksisterende om de finnes
DROP POLICY IF EXISTS "pages_owner_update" ON public.pages;
DROP POLICY IF EXISTS "pages_select" ON public.pages;
DROP POLICY IF EXISTS "pages_admin_all" ON public.pages;

-- Eiere, admins og redaktører kan oppdatere siden sin
CREATE POLICY "pages_owner_update" ON public.pages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = pages.id
      AND pp.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = pages.id
      AND pp.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'editor')
  )
);

-- Alle kan lese offentlige sider; medlemmer kan lese sine egne
CREATE POLICY "pages_select" ON public.pages
FOR SELECT USING (
  is_public = true
  OR
  EXISTS (
    SELECT 1
    FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = pages.id
      AND pp.user_id = auth.uid()
  )
);

-- Admin kan gjøre alt
CREATE POLICY "pages_admin_all" ON public.pages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
