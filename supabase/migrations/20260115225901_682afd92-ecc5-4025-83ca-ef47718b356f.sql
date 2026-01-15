-- Funksjon for å sende notifikasjon til alle admin-brukere når bilder lastes opp
CREATE OR REPLACE FUNCTION public.notify_admins_images_added(
  _car_id UUID,
  _car_title TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Gå gjennom alle admin-brukere og send notifikasjon
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
      car_id,
      is_read
    ) VALUES (
      admin_user.user_id,
      'images_added',
      'Nye bilder lastet opp',
      'Eier har lastet opp bilder til "' || _car_title || '". Bilen kan nå være klar for publisering.',
      _car_id,
      false
    );
  END LOOP;
END;
$$;