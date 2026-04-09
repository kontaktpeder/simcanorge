
-- 1. Trigger-funksjon: sett can_create_pages automatisk ved godkjenning/avslag
CREATE OR REPLACE FUNCTION public.sync_page_access_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.person_profiles
    SET can_create_pages = true
    WHERE id = NEW.profile_id;
  END IF;

  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.person_profiles
    SET can_create_pages = false
    WHERE id = NEW.profile_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Koble triggeren til tabellen
DROP TRIGGER IF EXISTS on_page_access_request_reviewed ON public.page_access_requests;

CREATE TRIGGER on_page_access_request_reviewed
  AFTER UPDATE OF status ON public.page_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_page_access_approval();

-- 3. Retroaktiv fiks: alle som allerede er godkjent får can_create_pages = true
UPDATE public.person_profiles pp
SET can_create_pages = true
FROM public.page_access_requests par
WHERE par.profile_id = pp.id
  AND par.status = 'approved'
  AND pp.can_create_pages = false;
