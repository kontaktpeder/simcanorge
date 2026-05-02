CREATE OR REPLACE FUNCTION public.enforce_car_publish_requirements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  img_count integer;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.published_at IS NOT NULL OR NEW.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Spottede biler er bevisst ufullstendige og publiseres automatisk
  IF NEW.source = 'spotting'::public.car_source THEN
    RETURN NEW;
  END IF;

  IF NEW.brand IS NULL OR btrim(NEW.brand::text) = '' THEN
    RAISE EXCEPTION 'Merke må være satt før publisering';
  END IF;

  IF NEW.model IS NULL OR btrim(NEW.model::text) = '' THEN
    RAISE EXCEPTION 'Modell må være satt før publisering';
  END IF;

  SELECT count(*)::integer INTO img_count FROM public.car_images WHERE car_id = NEW.id;
  IF img_count < 1 THEN
    RAISE EXCEPTION 'Minst ett bilde kreves for publisering';
  END IF;

  RETURN NEW;
END;
$function$;