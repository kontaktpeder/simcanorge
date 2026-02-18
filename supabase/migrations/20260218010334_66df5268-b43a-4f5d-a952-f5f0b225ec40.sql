
-- Function: Notify user that profile is pending approval
CREATE OR REPLACE FUNCTION public.notify_owner_profile_pending(
  _owner_id UUID,
  _display_name TEXT,
  _user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    link,
    is_read
  ) VALUES (
    _user_id,
    'owner_profile_pending',
    'Profil venter på godkjenning',
    'Din entusiastprofil er sendt til godkjenning. Du kan opprette annonser på markedsplassen når profilen er godkjent.',
    '/dashboard?showOwnerProfile=true',
    false
  );
END;
$$;

-- Function: Notify all admins about new pending profile
CREATE OR REPLACE FUNCTION public.notify_admins_owner_pending(
  _owner_id UUID,
  _display_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
BEGIN
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
      'owner_profile_pending_admin',
      'Ny profil venter på godkjenning',
      'Entusiastprofilen til ' || COALESCE(_display_name, 'en bruker') || ' venter på godkjenning.',
      '/admin/eierprofiler',
      false
    );
  END LOOP;
END;
$$;

-- Trigger function: Run on INSERT to owners when approved_at IS NULL
CREATE OR REPLACE FUNCTION public.trigger_notify_owner_profile_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved_at IS NULL THEN
    PERFORM public.notify_owner_profile_pending(NEW.id, NEW.display_name, NEW.user_id);
    PERFORM public.notify_admins_owner_pending(NEW.id, NEW.display_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_owner_profile_pending_trigger ON public.owners;
CREATE TRIGGER notify_owner_profile_pending_trigger
  AFTER INSERT ON public.owners
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_owner_profile_pending();
