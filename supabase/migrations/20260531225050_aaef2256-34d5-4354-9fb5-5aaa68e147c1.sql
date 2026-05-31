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
  new_brand text;
  new_model text;
  new_year integer;
  new_title text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF v_brand IS NULL AND v_model IS NULL AND p_year IS NULL
     AND p_year_from IS NULL AND p_year_to IS NULL AND v_comment IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_submission');
  END IF;

  SELECT id, identification_status, brand, model, year, title
  INTO c
  FROM public.cars
  WHERE id = p_car_id;

  IF c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_found');
  END IF;

  needs_info := (c.brand IS NULL OR btrim(c.brand::text) = '')
             OR (c.model IS NULL OR btrim(c.model::text) = '' OR c.model ILIKE 'ukjent%');

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

  -- Apply suggested values to the car itself (fill gaps, never overwrite existing data)
  new_brand := COALESCE(NULLIF(btrim(coalesce(c.brand, '')), ''), v_brand);
  new_model := CASE
    WHEN c.model IS NULL OR btrim(c.model) = '' OR c.model ILIKE 'ukjent%'
    THEN COALESCE(v_model, c.model)
    ELSE c.model
  END;
  new_year := COALESCE(c.year, p_year, p_year_from);
  new_title := btrim(
    coalesce(new_brand, '') || ' ' ||
    coalesce(new_model, '') ||
    CASE WHEN new_year IS NOT NULL THEN ' ' || new_year::text ELSE '' END
  );
  IF new_title = '' OR new_title IS NULL THEN
    new_title := c.title;
  END IF;

  UPDATE public.cars
  SET
    brand = COALESCE(brand, v_brand),
    model = CASE
      WHEN model IS NULL OR btrim(model) = '' OR model ILIKE 'ukjent%'
      THEN COALESCE(v_model, model)
      ELSE model
    END,
    year = COALESCE(year, p_year, p_year_from),
    title = new_title,
    identification_status = CASE
      WHEN identification_status = 'unknown'::public.car_identification_status
      THEN 'needs_review'::public.car_identification_status
      ELSE identification_status
    END,
    updated_at = now()
  WHERE id = p_car_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;