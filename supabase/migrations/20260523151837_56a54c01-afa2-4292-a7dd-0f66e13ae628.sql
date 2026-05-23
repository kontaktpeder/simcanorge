ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS related_brand_keys text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.pages.related_brand_keys IS
  'Andre brand_key for «Relaterte merker» på /merker/:brand';