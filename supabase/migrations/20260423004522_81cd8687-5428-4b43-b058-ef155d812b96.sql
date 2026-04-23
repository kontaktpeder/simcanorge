-- Fix notify_car_relationship_request:
-- Tidligere logikk satte `_has_owner` kun inni løkken over ANDRE eiere,
-- så når requester var eneste eier på en bil havnet varselet i admin-bøtta.
-- Nå sjekker vi separat om bilen har NOEN eier i car_owners, uavhengig
-- av om den eieren også er requester.

CREATE OR REPLACE FUNCTION public.notify_car_relationship_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _car_title text;
  _requester_name text;
  _car_has_any_owner boolean;
  _owner record;
BEGIN
  -- Hent bil-tittel
  SELECT title INTO _car_title
  FROM public.cars
  WHERE id = NEW.car_id;

  -- Hent requester-navn (best effort)
  SELECT COALESCE(display_name, full_name, 'En bruker') INTO _requester_name
  FROM public.person_profiles
  WHERE user_id = NEW.requester_id
  LIMIT 1;

  IF _requester_name IS NULL THEN
    _requester_name := 'En bruker';
  END IF;

  -- Sjekk om bilen har noen eier (uavhengig av om eieren er requester)
  SELECT EXISTS (
    SELECT 1 FROM public.car_owners co
    WHERE co.car_id = NEW.car_id AND co.role = 'owner'
  ) INTO _car_has_any_owner;

  -- Varsle alle eiere unntatt requester selv
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

  -- Admin-fallback KUN når bilen ikke har noen eier i det hele tatt
  IF NOT _car_has_any_owner THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, car_id)
    SELECT
      ur.user_id,
      'car_relationship_request',
      'Forespørsel mangler eier',
      _requester_name || ' har sendt en forespørsel om tilknytning til ' || COALESCE(_car_title, 'en bil') || ' som ikke har noen eier i Bilgarasje.',
      '/admin/relasjoner',
      NEW.car_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;

-- Defense-in-depth: blokker insert hvis requester allerede står i car_owners for samme bil
CREATE OR REPLACE FUNCTION public.block_relationship_request_when_already_linked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_id = NEW.car_id
      AND user_id = NEW.requester_id
  ) THEN
    RAISE EXCEPTION 'allerede_koblet'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_relationship_request_when_already_linked
  ON public.car_relationship_requests;

CREATE TRIGGER trg_block_relationship_request_when_already_linked
BEFORE INSERT ON public.car_relationship_requests
FOR EACH ROW
EXECUTE FUNCTION public.block_relationship_request_when_already_linked();
