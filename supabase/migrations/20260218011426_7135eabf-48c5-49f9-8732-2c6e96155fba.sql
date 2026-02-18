-- Function: User requests seller approval – notifies all admins
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
  -- Get user's owner profile (must be unapproved)
  SELECT id, display_name, user_id
  INTO _owner
  FROM public.owners
  WHERE user_id = auth.uid()
  AND approved_at IS NULL
  LIMIT 1;

  IF _owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingen profil funnet eller allerede godkjent.');
  END IF;

  -- Send notification to all admins
  FOR admin_user IN
    SELECT user_id
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      link,
      is_read
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