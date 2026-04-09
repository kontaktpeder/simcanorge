
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_type_variant text,
  ADD COLUMN IF NOT EXISTS brand_key text;

ALTER TABLE pages
  ADD CONSTRAINT pages_page_type_variant_check
  CHECK (
    page_type_variant IN ('brand', 'local', 'community')
    OR page_type_variant IS NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS pages_brand_hub_unique_idx
  ON pages (lower(brand_key))
  WHERE page_type_variant = 'brand' AND brand_key IS NOT NULL;

COMMENT ON COLUMN pages.page_type_variant IS 'brand = offisiell merkehub | local = lokal klubb | community';
COMMENT ON COLUMN pages.brand_key IS 'Normalisert merkenøkkel, lowercase. Kun for brand hubs.';
