
CREATE POLICY "Owners can delete inquiry items for their inquiries"
ON public.inquiry_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.inquiries i
    JOIN public.owners o ON o.id = i.recipient_owner_id
    WHERE i.id = inquiry_items.inquiry_id
    AND o.user_id = auth.uid()
  )
);
