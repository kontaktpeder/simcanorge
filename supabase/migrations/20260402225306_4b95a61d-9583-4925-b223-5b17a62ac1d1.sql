CREATE POLICY "pages_owner_delete" ON public.pages
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM page_memberships pm
    JOIN person_profiles pp ON pp.id = pm.person_profile_id
    WHERE pm.page_id = pages.id
      AND pp.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
  )
);