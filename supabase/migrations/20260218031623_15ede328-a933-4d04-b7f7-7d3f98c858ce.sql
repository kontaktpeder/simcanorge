-- Legg til 'sold' i tillatte statuser for marketplace_items
CREATE OR REPLACE FUNCTION public.validate_marketplace_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_mode NOT IN ('form_only', 'show_contact') THEN
    RAISE EXCEPTION 'Invalid contact_mode: %', NEW.contact_mode;
  END IF;
  IF NEW.status NOT IN ('draft', 'submitted', 'published', 'archived', 'sold') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;