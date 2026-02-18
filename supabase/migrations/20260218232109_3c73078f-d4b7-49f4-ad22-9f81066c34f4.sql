
CREATE POLICY "Owners can delete their own inquiries"
ON public.inquiries
FOR DELETE
USING (
  recipient_owner_id IS NOT NULL
  AND recipient_owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);
