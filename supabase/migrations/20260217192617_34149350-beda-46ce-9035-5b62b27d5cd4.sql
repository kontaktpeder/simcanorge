
-- Add price columns to parts
ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS price_min integer,
  ADD COLUMN IF NOT EXISTS price_max integer;

-- Multi-image support for parts
CREATE TABLE IF NOT EXISTS part_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS part_images_part_id_idx ON part_images(part_id);

ALTER TABLE part_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images of published parts
CREATE POLICY "Anyone can view published part images"
  ON part_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parts WHERE parts.id = part_images.part_id AND parts.published = true
  ));

-- Admins can manage part images
CREATE POLICY "Admins can manage part images"
  ON part_images FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
