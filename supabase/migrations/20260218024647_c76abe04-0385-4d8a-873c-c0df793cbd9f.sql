
-- 1) Add recipient_owner_id to inquiries
ALTER TABLE public.inquiries 
  ADD COLUMN IF NOT EXISTS recipient_owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.inquiries.recipient_owner_id IS 'Null = admin. Satt = selger som mottar forespørselen.';

-- 2) RLS: Selgere kan lese sine egne forespørsler
CREATE POLICY "Owners can view their own inquiries"
ON public.inquiries FOR SELECT TO authenticated
USING (
  recipient_owner_id IS NOT NULL
  AND recipient_owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
);

-- 3) RLS: Selgere kan oppdatere sine egne forespørsler
CREATE POLICY "Owners can update their own inquiries"
ON public.inquiries FOR UPDATE TO authenticated
USING (
  recipient_owner_id IS NOT NULL
  AND recipient_owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
)
WITH CHECK (
  recipient_owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
);

-- 4) RLS: Selgere kan lese inquiry_items for sine forespørsler
CREATE POLICY "Owners can view inquiry items for their inquiries"
ON public.inquiry_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inquiries i
    JOIN public.owners o ON o.id = i.recipient_owner_id AND o.user_id = auth.uid()
    WHERE i.id = inquiry_items.inquiry_id
  )
);
