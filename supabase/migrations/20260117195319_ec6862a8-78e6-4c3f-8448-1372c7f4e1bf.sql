-- Add columns to track who sent invitation email and optional note
ALTER TABLE public.car_invitations
ADD COLUMN sent_by text,
ADD COLUMN sender_note text;

-- Add comment for documentation
COMMENT ON COLUMN public.car_invitations.sent_by IS 'Name of person who sent the invitation email (e.g. peder, peter)';
COMMENT ON COLUMN public.car_invitations.sender_note IS 'Optional internal note about the invitation';