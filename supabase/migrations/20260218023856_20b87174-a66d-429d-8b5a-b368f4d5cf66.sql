
-- Add contact fields to owners
ALTER TABLE public.owners
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text;
