-- Always notify admins on new car relationship requests (in addition to car owners).
CREATE OR REPLACE FUNCTION public.notify_car_relationship_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _car_title text;
  _requester_name text;
  _car_has_any_owner boolean;
  _owner record;
BEGIN
  SELECT title INTO _car_title FROM public.cars WHERE id = NEW.car_id;

  SELECT COALESCE(display_name, full_name, 'En bruker') INTO _requester_name
  FROM public.person_profiles
  WHERE user_id = NEW.requester_id
  LIMIT 1;

  IF _requester_name IS NULL THEN
    _requester_name := 'En bruker';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.car_owners co
    WHERE co.car_id = NEW.car_id AND co.role = 'owner'
  ) INTO _car_has_any_owner;

  -- Notify owners (if any) — exclude requester
  FOR _owner IN
    SELECT user_id
    FROM public.car_owners
    WHERE car_id = NEW.car_id
      AND role = 'owner'
      AND user_id <> NEW.requester_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, car_id)
    VALUES (
      _owner.user_id,
      'car_relationship_request',
      'Ny forespørsel om tilknytning',
      _requester_name || ' har sendt en forespørsel om tilknytning til ' || COALESCE(_car_title, 'bilen din') || '.',
      '/dashboard/bil/' || NEW.car_id::text,
      NEW.car_id
    );
  END LOOP;

  -- Always notify admins for oversight (previously only when no owner existed).
  INSERT INTO public.notifications (user_id, type, title, body, link, car_id)
  SELECT
    ur.user_id,
    'car_relationship_request',
    CASE WHEN _car_has_any_owner
      THEN 'Ny forespørsel om tilknytning'
      ELSE 'Forespørsel mangler eier'
    END,
    _requester_name || ' har sendt en forespørsel om tilknytning til ' || COALESCE(_car_title, 'en bil') ||
      CASE WHEN _car_has_any_owner THEN '.' ELSE ' som ikke har noen eier i Bilgarasje.' END,
    '/admin/relasjoner',
    NEW.car_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> NEW.requester_id;

  RETURN NEW;
END;
$function$;