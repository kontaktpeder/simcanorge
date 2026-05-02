-- A) Enum + column on cars
DO $$ BEGIN
  CREATE TYPE public.car_identification_status AS ENUM ('unknown', 'needs_review', 'identified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS identification_status public.car_identification_status NOT NULL DEFAULT 'identified';

COMMENT ON COLUMN public.cars.identification_status IS
  'Community identification state: unknown/needs_review/identified';

CREATE INDEX IF NOT EXISTS idx_cars_identification_status
  ON public.cars(identification_status);

-- B) Suggestions table
CREATE TABLE IF NOT EXISTS public.car_identification_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  submitter_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  suggested_brand text NOT NULL,
  suggested_model text NOT NULL,
  suggested_year int NULL,
  suggested_year_from int NULL,
  suggested_year_to int NULL,
  comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_ident_suggestions_car_created
  ON public.car_identification_suggestions(car_id, created_at desc);

ALTER TABLE public.car_identification_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read identification suggestions" ON public.car_identification_suggestions;
CREATE POLICY "Admins can read identification suggestions"
  ON public.car_identification_suggestions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- C) RPC: anyone authenticated can submit
CREATE OR REPLACE FUNCTION public.submit_car_identification_suggestion(
  p_car_id uuid,
  p_brand text,
  p_model text,
  p_year int DEFAULT NULL,
  p_year_from int DEFAULT NULL,
  p_year_to int DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  c record;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_brand IS NULL OR btrim(p_brand) = '' OR p_model IS NULL OR btrim(p_model) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'brand_and_model_required');
  END IF;

  SELECT id, identification_status
  INTO c
  FROM public.cars
  WHERE id = p_car_id;

  IF c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_found');
  END IF;

  IF c.identification_status = 'identified'::public.car_identification_status THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_identified');
  END IF;

  INSERT INTO public.car_identification_suggestions(
    car_id, submitter_id,
    suggested_brand, suggested_model,
    suggested_year, suggested_year_from, suggested_year_to,
    comment
  ) VALUES (
    p_car_id, uid,
    btrim(p_brand), btrim(p_model),
    p_year, p_year_from, p_year_to,
    nullif(btrim(p_comment), '')
  );

  UPDATE public.cars
  SET identification_status = 'needs_review'::public.car_identification_status
  WHERE id = p_car_id
    AND identification_status = 'unknown'::public.car_identification_status;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_car_identification_suggestion(uuid, text, text, int, int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_car_identification_suggestion(uuid, text, text, int, int, int, text) TO authenticated;

-- D) Public listing policy for UNKNOWN/needs_review spotted cars
DROP POLICY IF EXISTS "Public can list unknown identification cars" ON public.cars;
CREATE POLICY "Public can list unknown identification cars"
  ON public.cars
  FOR SELECT
  TO anon, authenticated
  USING (
    identification_status IN ('unknown'::public.car_identification_status, 'needs_review'::public.car_identification_status)
    AND source = 'spotting'::public.car_source
    AND published_at IS NULL
  );