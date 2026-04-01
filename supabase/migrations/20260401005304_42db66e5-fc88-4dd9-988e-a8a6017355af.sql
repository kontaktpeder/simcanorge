
CREATE OR REPLACE FUNCTION public.create_page_with_owner(
  p_page_type text,
  p_title text,
  p_slug text,
  p_tagline text DEFAULT NULL,
  p_about text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_theme_color text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_founded_year integer DEFAULT NULL,
  p_is_public boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _person_id uuid;
  _page_id uuid;
BEGIN
  -- Get the person profile for the calling user
  SELECT id INTO _person_id
  FROM public.person_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF _person_id IS NULL THEN
    RAISE EXCEPTION 'Person profile not found for current user';
  END IF;

  -- Check that user can create pages
  IF NOT (SELECT can_create_pages FROM public.person_profiles WHERE id = _person_id) THEN
    RAISE EXCEPTION 'User does not have permission to create pages';
  END IF;

  -- Insert the page
  INSERT INTO public.pages (
    page_type, title, slug, tagline, about, logo_url, cover_url,
    theme_color, contact_email, contact_phone, website, location,
    founded_year, is_public, created_by, status
  ) VALUES (
    p_page_type, p_title, p_slug, p_tagline, p_about, p_logo_url, p_cover_url,
    p_theme_color, p_contact_email, p_contact_phone, p_website, p_location,
    p_founded_year, p_is_public, _person_id, 'active'
  )
  RETURNING id INTO _page_id;

  -- Add creator as owner
  INSERT INTO public.page_memberships (page_id, person_profile_id, role, invited_by)
  VALUES (_page_id, _person_id, 'owner', _person_id);

  RETURN jsonb_build_object('id', _page_id, 'slug', p_slug);
END;
$$;
