DROP FUNCTION IF EXISTS public.submit_car_identification_suggestion(uuid,text,text,integer,integer,integer,text);

CREATE OR REPLACE FUNCTION public.submit_car_identification_suggestion(
  p_car_id uuid,
  p_brand text,
  p_model text,
  p_year integer,
  p_year_from integer,
  p_year_to integer,
  p_comment text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_brand text := NULLIF(btrim(coalesce(p_brand, '')), '');
  v_model text := NULLIF(btrim(coalesce(p_model, '')), '');
  v_comment text := NULLIF(btrim(coalesce(p_comment, '')), '');
  c record;
  applied_brand text;
  applied_model text;
  applied_year integer;
  model_conflict boolean := false;
  brand_conflict boolean := false;
  changed boolean := false;
  new_title text;
  v_code text := 'stored_only';
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF v_brand IS NULL AND v_model IS NULL AND p_year IS NULL
     AND p_year_from IS NULL AND p_year_to IS NULL AND v_comment IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_submission');
  END IF;

  SELECT id, brand, model, year, title, identification_status
    INTO c
    FROM public.cars
   WHERE id = p_car_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'car_not_found');
  END IF;

  INSERT INTO public.car_identification_suggestions
    (car_id, submitter_id, suggested_brand, suggested_model,
     suggested_year, suggested_year_from, suggested_year_to, comment)
  VALUES
    (p_car_id, v_user, v_brand, v_model,
     p_year, p_year_from, p_year_to, v_comment);

  applied_brand := NULLIF(btrim(coalesce(c.brand, '')), '');
  applied_model := c.model;
  IF applied_model IS NULL OR btrim(applied_model) = '' OR lower(btrim(applied_model)) = 'ukjent' THEN
    applied_model := NULL;
  END IF;
  applied_year := c.year;

  IF v_brand IS NOT NULL THEN
    IF applied_brand IS NULL THEN
      applied_brand := v_brand;
      changed := true;
    ELSIF lower(applied_brand) <> lower(v_brand) THEN
      brand_conflict := true;
    END IF;
  END IF;

  IF v_model IS NOT NULL THEN
    IF applied_model IS NULL THEN
      applied_model := v_model;
      changed := true;
    ELSIF lower(v_model) LIKE lower(applied_model) || '%'
          AND length(v_model) > length(applied_model) THEN
      applied_model := v_model;
      changed := true;
    ELSIF lower(applied_model) <> lower(v_model) THEN
      model_conflict := true;
    END IF;
  END IF;

  IF p_year IS NOT NULL AND applied_year IS NULL THEN
    applied_year := p_year;
    changed := true;
  END IF;

  IF brand_conflict OR model_conflict THEN
    RETURN jsonb_build_object('ok', true, 'code', 'stored_conflict');
  END IF;

  IF changed THEN
    new_title := btrim(
      concat_ws(' ',
        applied_brand,
        CASE WHEN applied_model IS NOT NULL AND lower(applied_model) <> 'ukjent' THEN applied_model END,
        applied_year::text
      )
    );
    IF new_title = '' THEN
      new_title := c.title;
    END IF;

    UPDATE public.cars
       SET brand = COALESCE(applied_brand, brand),
           model = COALESCE(applied_model, model),
           year  = COALESCE(applied_year, year),
           title = new_title,
           identification_status = CASE
             WHEN identification_status = 'unknown'::car_identification_status
               THEN 'needs_review'::car_identification_status
             ELSE identification_status
           END,
           updated_at = now()
     WHERE id = p_car_id;

    v_code := 'applied';
  ELSE
    IF v_comment IS NULL
       AND (v_brand IS NULL OR lower(coalesce(c.brand,'')) = lower(v_brand))
       AND (v_model IS NULL OR lower(coalesce(c.model,'')) = lower(v_model))
       AND (p_year IS NULL OR c.year = p_year)
       AND (v_brand IS NOT NULL OR v_model IS NOT NULL OR p_year IS NOT NULL) THEN
      v_code := 'duplicate';
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'code', v_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_car_identification_suggestion(uuid,text,text,integer,integer,integer,text) TO authenticated;