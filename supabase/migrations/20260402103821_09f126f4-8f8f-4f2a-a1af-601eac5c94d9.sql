-- Add a direct self-read policy so users can read their own memberships without recursive lookup
CREATE POLICY "page_memberships_own_read"
ON public.page_memberships
FOR SELECT
TO authenticated
USING (
  person_profile_id IN (
    SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
  )
);