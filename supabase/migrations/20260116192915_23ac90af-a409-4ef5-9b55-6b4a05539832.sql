-- Legg til message_type i messages tabellen
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'contact';

-- Legg til status og admin_notes i inquiries tabellen
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Legg til DELETE policy for inquiries (admin only)
CREATE POLICY "Admins can delete inquiries"
ON public.inquiries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Legg til DELETE policy for support_tickets (admin only)
CREATE POLICY "Admins can delete support tickets"
ON public.support_tickets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));