CREATE OR REPLACE FUNCTION public.submit_car_identification_suggestion(
  p_car_id uuid,
  p_brand text,
  p_model text,
  p_year integer DEFAULT NULL,
  p_year_from integer DEFAULT NULL,
  p_year_to integer DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  c record;
  v_brand text := NULLIF(btrim(coalesce(p_brand, '')), '');
  v_model text := NULLIF(btrim(coalesce(p_model, '')), '');
  v_comment text := NULLIF(btrim(coalesce(p_comment, '')), '');
  needs_info boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF v_brand IS NULL AND v_model IS NULL AND p_year IS NULL
     AND p_year_from IS NULL AND p_year_to IS NULL AND v_comment IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_submission');
  END IF;

  SELECT id, identification_status, brand, model
  INTO c
  FROM public.cars
  WHERE id = p_car_id;

  IF c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_found');
  END IF;

  needs_info := (c.brand IS NULL OR btrim(c.brand::text) = '')
             OR (c.model IS NULL OR btrim(c.model::text) = '');

  IF c.identification_status = 'identified'::public.car_identification_status AND NOT needs_info THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_identified');
  END IF;

  INSERT INTO public.car_identification_suggestions(
    car_id, submitter_id,
    suggested_brand, suggested_model,
    suggested_year, suggested_year_from, suggested_year_to,
    comment
  ) VALUES (
    p_car_id, uid,
    v_brand, v_model,
    p_year, p_year_from, p_year_to,
    v_comment
  );

  UPDATE public.cars
  SET identification_status = 'needs_review'::public.car_identification_status
  WHERE id = p_car_id
    AND identification_status = 'unknown'::public.car_identification_status;

  RETURN jsonb_build_object('ok', true);
END;
$function$;