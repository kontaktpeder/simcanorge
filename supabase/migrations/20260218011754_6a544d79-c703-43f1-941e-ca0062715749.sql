
-- Add column to track when a user requested approval
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS requested_approval_at timestamp with time zone DEFAULT NULL;

-- Update the RPC to also set requested_approval_at on the owner profile
CREATE OR REPLACE FUNCTION public.request_seller_approval()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner RECORD;
  admin_user RECORD;
  _count int := 0;
BEGIN
  SELECT id, display_name, user_id
  INTO _owner
  FROM public.owners
  WHERE user_id = auth.uid()
  AND approved_at IS NULL
  LIMIT 1;

  IF _owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen profil funnet eller allerede godkjent.');
  END IF;

  -- Mark the owner as having requested approval
  UPDATE public.owners
  SET requested_approval_at = now()
  WHERE id = _owner.id;

  FOR admin_user IN
    SELECT user_id
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, body, link, is_read
    ) VALUES (
      admin_user.user_id,
      'seller_approval_request',
      'Forespørsel om godkjenning som selger',
      COALESCE(_owner.display_name, 'En bruker') || ' ber om å bli godkjent som selger.',
      '/admin/eierprofiler',
      false
    );
    _count := _count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'notified_count', _count);
END;
$$;
