
-- 1. Ny kolonne
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cars.created_by_user_id IS 'Bruker som opprettet bilen via selvbetjening';

CREATE INDEX IF NOT EXISTS idx_cars_created_by_user_id ON public.cars(created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

-- 2. RLS: Innlogget bruker kan opprette egen kladd-bil
CREATE POLICY "Authenticated users can create own draft cars"
ON public.cars
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND source = 'owner_self'::public.car_source
  AND status IN ('draft'::public.car_status, 'submitted'::public.car_status)
  AND published_at IS NULL
  AND approved_at IS NULL
  AND approved_by IS NULL
);

-- 3. RLS: Eier kan knytte seg til bil de selv opprettet
CREATE POLICY "Users can claim ownership of self-created cars"
ON public.car_owners
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id = car_owners.car_id
      AND c.created_by_user_id = auth.uid()
      AND c.published_at IS NULL
  )
);

-- 4. Publiseringstrigger
CREATE OR REPLACE FUNCTION public.enforce_car_publish_requirements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER tr_enforce_car_publish_requirements
  BEFORE UPDATE OF published_at ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_car_publish_requirements();
